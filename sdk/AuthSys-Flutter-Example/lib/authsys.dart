import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class AuthSysClient {
  final String appSecret;
  final String version;
  final String apiUrl;
  String? sessionToken;
  String lastError = '';
  Map<String, dynamic> lastResponse = {};
  bool initialized = false;
  String username = '';
  String email = '';
  Map<String, dynamic> appData = {};

  AuthSysClient({
    required this.appSecret,
    required this.version,
    this.apiUrl = 'https://authsys-main-production.up.railway.app/api/v1',
  }) : _baseUrl = apiUrl.replaceAll(RegExp(r'/+$'), '');

  final String _baseUrl;

  String getHWID() {
    try {
      if (Platform.isWindows) {
        final result = Process.runSync('wmic', ['csproduct', 'get', 'uuid']);
        if (result.exitCode == 0) {
          final lines = result.stdout.toString().split('\n');
          for (final line in lines) {
            final trimmed = line.trim();
            if (trimmed.isNotEmpty && !trimmed.contains('UUID')) {
              return trimmed;
            }
          }
        }
      } else if (Platform.isLinux) {
        final file = File('/etc/machine-id');
        if (file.existsSync()) {
          return file.readAsStringSync().trim();
        }
      } else if (Platform.isMacOS) {
        final result = Process.runSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice']);
        if (result.exitCode == 0) {
          for (final line in result.stdout.toString().split('\n')) {
            if (line.contains('IOPlatformUUID')) {
              final parts = line.split('"');
              if (parts.length >= 4) return parts[3];
            }
          }
        }
      }
    } catch (_) {}
    return 'UNKNOWN_HWID';
  }

  Future<Map<String, dynamic>> _post(String endpoint, {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    final url = Uri.parse('$_baseUrl/client/$endpoint');
    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      if (headers != null) ...headers,
    };

    try {
      final response = await http
          .post(url, headers: reqHeaders, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 30));
      lastResponse = jsonDecode(response.body) as Map<String, dynamic>;
      return lastResponse;
    } catch (e) {
      lastResponse = {'success': false, 'detail': 'Connection error: $e'};
      return lastResponse;
    }
  }

  Future<Map<String, dynamic>> init({String appName = ''}) async {
    lastError = '';
    lastResponse = {};
    initialized = false;

    final data = await _post('init', body: {
      'app_secret': appSecret,
      'version': version,
      'app_name': appName,
      'hwid': getHWID(),
    });

    final status = data['status'] as String?;
    if (status == 'success' || status == 'update_available') {
      initialized = true;
      appData = (data['variables'] as Map<String, dynamic>?) ?? {};
    } else {
      lastError = data['detail'] as String? ?? data['message'] as String? ?? 'Init failed';
    }
    return data;
  }

  Future<Map<String, dynamic>> register(String username, String password, String licenseKey, {String? email}) async {
    lastError = '';
    lastResponse = {};
    if (!initialized) {
      lastError = 'init() failed or not called';
      return {'success': false, 'detail': lastError};
    }

    final body = <String, dynamic>{
      'app_secret': appSecret,
      'username': username,
      'password': password,
      'license_key': licenseKey,
      'hwid': getHWID(),
    };
    if (email != null && email.isNotEmpty) body['email'] = email;

    final data = await _post('register', body: body);

    if (data['detail'] != null) {
      lastError = data['detail'] as String;
    } else if (data['success'] != true) {
      lastError = 'Registration failed';
    }
    return data;
  }

  Future<Map<String, dynamic>> login(String username, String password, {int sessionLength = 86400}) async {
    lastError = '';
    lastResponse = {};
    sessionToken = null;
    if (!initialized) {
      lastError = 'init() failed or not called';
      return {'success': false, 'detail': lastError};
    }

    final data = await _post('login', body: {
      'app_secret': appSecret,
      'username': username,
      'password': password,
      'hwid': getHWID(),
      'session_length': sessionLength,
    });

    if (data['detail'] != null) {
      lastError = data['detail'] as String;
    } else if (data['success'] == true && data['token'] != null) {
      sessionToken = data['token'] as String;
      this.username = username;
      email = data['email'] as String? ?? '';
    } else if (data['success'] != true) {
      lastError = 'Login failed: server returned success=false';
    }
    return data;
  }

  Future<Map<String, dynamic>> licenseLogin(String licenseKey, {int sessionLength = 86400}) async {
    lastError = '';
    lastResponse = {};
    sessionToken = null;
    if (!initialized) {
      lastError = 'init() failed or not called';
      return {'success': false, 'detail': lastError};
    }

    final data = await _post('license-login', body: {
      'app_secret': appSecret,
      'license_key': licenseKey,
      'hwid': getHWID(),
      'session_length': sessionLength,
    });

    if (data['detail'] != null) {
      lastError = data['detail'] as String;
    } else if (data['success'] == true && data['token'] != null) {
      sessionToken = data['token'] as String;
      username = data['username'] as String? ?? '';
    } else if (data['success'] != true) {
      lastError = 'License login failed: server returned success=false';
    }
    return data;
  }

  Future<Map<String, dynamic>> licenseCheck(String licenseKey) async {
    lastError = '';
    lastResponse = {};
    final data = await _post('license/check', body: {
      'app_secret': appSecret,
      'license_key': licenseKey,
    });
    if (data['detail'] != null) lastError = data['detail'] as String;
    return data;
  }

  Future<Map<String, dynamic>> verify() async {
    lastError = '';
    lastResponse = {};
    if (sessionToken == null || sessionToken!.isEmpty) {
      lastError = 'No active session. Login first.';
      return {'success': false, 'detail': lastError};
    }

    final data = await _post('verify', headers: {
      'Authorization': 'Bearer $sessionToken',
      'X-HWID': getHWID(),
    });

    if (data['detail'] != null) {
      lastError = data['detail'] as String;
    } else if (data['valid'] != true) {
      lastError = 'Session verification failed';
    }
    return data;
  }

  Future<Map<String, dynamic>> chatSend(int roomId, String message) async {
    lastError = '';
    lastResponse = {};
    if (sessionToken == null || sessionToken!.isEmpty) {
      lastError = 'No active session. Login first.';
      return {'success': false, 'detail': lastError};
    }

    final encoded = Uri.encodeComponent(message);
    final data = await _post('chat/send?room_id=$roomId&message=$encoded', headers: {
      'Authorization': 'Bearer $sessionToken',
    });
    if (data['detail'] != null) lastError = data['detail'] as String;
    return data;
  }

  String? var(String name) {
    return appData[name] as String?;
  }

  void logout() {
    sessionToken = null;
    username = '';
    email = '';
    lastError = '';
    lastResponse = {};
  }
}
