import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthSysException implements Exception {
  final String message;
  final int statusCode;
  final String errorCode;

  AuthSysException(this.message, {this.statusCode = 0, this.errorCode = ''});

  @override
  String toString() => '[$errorCode] $message';
}

class AuthSysOptions {
  final String appSecret;
  final String appName;
  final String version;
  final String apiUrl;
  final int timeout;
  final int maxRetries;
  final bool skipCertificateValidation;
  final bool enableLogging;
  final String hwid;

  AuthSysOptions({
    required this.appSecret,
    this.appName = '',
    this.version = '',
    this.apiUrl = 'https://api.authsys.dpdns.org/api/v1',
    this.timeout = 30,
    this.maxRetries = 3,
    this.skipCertificateValidation = false,
    this.enableLogging = false,
    this.hwid = '',
  });
}

class AuthSys {
  final AuthSysOptions _options;
  String _sessionToken = '';
  bool _initialized = false;
  Map<String, dynamic> _appVariables = {};
  String _username = '';

  AuthSys(this._options);

  AuthSys.fromSecret(String appSecret)
      : _options = AuthSysOptions(appSecret: appSecret);

  String _getHwid() {
    return _options.hwid.isNotEmpty ? _options.hwid : getHwid();
  }

  void _log(String message) {
    if (_options.enableLogging) {
      print('[AuthSys] $message');
    }
  }

  Future<Map<String, dynamic>> _sendRequest(
    String endpoint, {
    Map<String, dynamic>? data,
    Map<String, String>? headers,
  }) async {
    final url = '${_options.apiUrl}/client/$endpoint';
    var lastError;

    for (var attempt = 0; attempt <= _options.maxRetries; attempt++) {
      _log('POST $url (attempt ${attempt + 1})');
      try {
        final response = await http
            .post(
              Uri.parse(url),
              body: data != null ? jsonEncode(data) : null,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...?headers,
              },
            )
            .timeout(Duration(seconds: _options.timeout));

        final responseBody = response.body;
        _log('Response: ${response.statusCode} - $responseBody');

        if (response.statusCode < 200 || response.statusCode >= 300) {
          var detail = responseBody;
          try {
            final errorData = jsonDecode(responseBody);
            if (errorData is Map && errorData.containsKey('detail')) {
              detail = errorData['detail'];
            }
          } catch (e) {}

          String errorCode = 'api_error';
          switch (response.statusCode) {
            case 401:
              errorCode = 'unauthorized';
              break;
            case 403:
              errorCode = 'forbidden';
              break;
            case 404:
              errorCode = 'not_found';
              break;
            case 429:
              errorCode = 'rate_limited';
              break;
            case 503:
              errorCode = 'maintenance';
              break;
          }
          throw AuthSysException(
            detail,
            statusCode: response.statusCode,
            errorCode: errorCode,
          );
        }

        try {
          return jsonDecode(responseBody) as Map<String, dynamic>;
        } catch (e) {
          return {};
        }
      } catch (e) {
        if (e is AuthSysException) throw e;
        lastError = e.toString();
        _log('Request error (attempt ${attempt + 1}): $lastError');
        if (attempt < _options.maxRetries) {
          await Future.delayed(Duration(seconds: 1 << attempt));
        }
      }
    }

    throw AuthSysException(
      lastError ?? 'Request failed after all retries',
      errorCode: 'network_error',
    );
  }

  Future<void> init() async {
    _log('Initializing...');
    final data = {
      'app_secret': _options.appSecret,
      'version': _options.version,
      'app_name': _options.appName,
      'hwid': _getHwid(),
    };

    final result = await _sendRequest('init', data: data);
    final status = result['status'] ?? '';

    if (status == 'update_required') {
      throw AuthSysException(
        result['message'] ?? 'Update required',
        errorCode: 'version_mismatch',
      );
    }

    _initialized = status == 'success' || status == 'update_available';
    if (result['variables'] != null) {
      _appVariables = result['variables'] as Map<String, dynamic>;
    }
  }

  Future<Map<String, dynamic>> register(
    String username,
    String password,
    String licenseKey, {
    String? email,
  }) async {
    if (!_initialized) {
      throw AuthSysException(
        'Not initialized. Call init() first.',
        errorCode: 'not_initialized',
      );
    }

    final data = {
      'app_secret': _options.appSecret,
      'username': username,
      'password': password,
      'license_key': licenseKey,
      'hwid': _getHwid(),
    };
    if (email != null && email.isNotEmpty) {
      data['email'] = email;
    }

    return await _sendRequest('register', data: data);
  }

  Future<Map<String, dynamic>> login(
    String username,
    String password, {
    int sessionLength = 86400,
  }) async {
    if (!_initialized) {
      throw AuthSysException(
        'Not initialized. Call init() first.',
        errorCode: 'not_initialized',
      );
    }

    _sessionToken = '';
    final data = {
      'app_secret': _options.appSecret,
      'username': username,
      'password': password,
      'hwid': _getHwid(),
      'session_length': sessionLength,
    };

    final result = await _sendRequest('login', data: data);
    if (result['token'] != null && result['token'].isNotEmpty) {
      _sessionToken = result['token'];
    }
    if (result['username'] != null) {
      _username = result['username'];
    }
    return result;
  }

  Future<Map<String, dynamic>> licenseLogin(
    String licenseKey, {
    int sessionLength = 86400,
  }) async {
    if (!_initialized) {
      throw AuthSysException(
        'Not initialized. Call init() first.',
        errorCode: 'not_initialized',
      );
    }

    _sessionToken = '';
    final data = {
      'app_secret': _options.appSecret,
      'license_key': licenseKey,
      'hwid': _getHwid(),
      'session_length': sessionLength,
    };

    final result = await _sendRequest('license-login', data: data);
    if (result['token'] != null && result['token'].isNotEmpty) {
      _sessionToken = result['token'];
    }
    if (result['username'] != null) {
      _username = result['username'];
    }
    return result;
  }

  Future<Map<String, dynamic>> licenseCheck(String licenseKey) async {
    final data = {
      'app_secret': _options.appSecret,
      'license_key': licenseKey,
    };
    return await _sendRequest('license/check', data: data);
  }

  Future<Map<String, dynamic>> verify() async {
    if (_sessionToken.isEmpty) {
      throw AuthSysException(
        'No active session. Login first.',
        errorCode: 'no_session',
      );
    }

    final headers = {
      'Authorization': 'Bearer $_sessionToken',
      'X-HWID': _getHwid(),
    };
    return await _sendRequest('verify', headers: headers);
  }

  Future<Map<String, dynamic>> sendChatMessage(int roomId, String message) async {
    if (_sessionToken.isEmpty) {
      throw AuthSysException(
        'No active session. Login first.',
        errorCode: 'no_session',
      );
    }

    final headers = {'Authorization': 'Bearer $_sessionToken'};
    final endpoint = 'chat/send?room_id=$roomId&message=${Uri.encodeComponent(message)}';
    return await _sendRequest(endpoint, headers: headers);
  }

  Future<Map<String, dynamic>> registerDevice(String hwid, {String? deviceName}) async {
    final data = {
      'app_secret': _options.appSecret,
      'hwid': hwid,
    };
    if (deviceName != null && deviceName.isNotEmpty) {
      data['device_name'] = deviceName;
    }
    return await _sendRequest('device/register', data: data);
  }

  Future<Map<String, dynamic>> checkDevice(String hwid) async {
    final data = {
      'app_secret': _options.appSecret,
      'hwid': hwid,
    };
    return await _sendRequest('device/check', data: data);
  }

  dynamic getVariable(String key) => _appVariables[key];

  Map<String, dynamic> getAllVariables() => _appVariables;

  void logout() => _sessionToken = '';

  bool get isAuthenticated => _sessionToken.isNotEmpty;
  bool get isInitialized => _initialized;
  String get username => _username;
}

String getHwid() {
  return 'flutter_hwid_placeholder';
}

String hashString(String input) {
  return input.hashCode.toString();
}

String generateGuid() {
  return DateTime.now().millisecondsSinceEpoch.toString();
}
