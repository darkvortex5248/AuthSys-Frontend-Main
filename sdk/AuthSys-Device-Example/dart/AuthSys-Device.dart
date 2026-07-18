import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class AuthSysDevice {
  final String _appSecret;
  final String _baseUrl;
  String lastError = '';
  String lastResponse = '';

  AuthSysDevice(this._appSecret,
      [String baseUrl = 'https://authsys-main-production.up.railway.app/device'])
      : _baseUrl = baseUrl.replaceAll(RegExp(r'/+$'), '');

  static String _getHWID() {
    try {
      final buf = StringBuffer();
      buf.write(Platform.hostname);
      buf.write(Platform.operatingSystem);
      buf.write(Platform.operatingSystemVersion);
      try {
        final interfaces = NetworkInterface.list();
        for (final iface in interfaces) {
          if (iface.addresses.isNotEmpty) {
            buf.write(iface.addresses.first.address);
          }
        }
      } catch (_) {}
      final digest = utf8.encode(buf.toString());
      final md5 = List<int>.generate(16, (_) => 0);
      int a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
      final chunks = [];
      for (var i = 0; i < digest.length; i += 64) {
        chunks.add(digest.sublist(i, i + 64 > digest.length ? digest.length : i + 64));
      }
      chunks.add([0x80]);
      final lenBits = digest.length * 8;
      for (var i = 0; i < 56 - (digest.length % 64 + 1); i++) {
        chunks.last.add(0);
      }
      for (var i = 0; i < 8; i++) {
        chunks.last.add((lenBits >> (i * 8)) & 0xFF);
      }
      for (final chunk in chunks) {
        int f, g;
        for (var i = 0; i < 64; i++) {
          if (i < 16) { f = (b & c) | (~b & d); g = i; }
          else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
          else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
          else { f = c ^ (b | ~d); g = (7 * i) % 16; }
          final temp = d;
          d = c;
          c = b;
          b = b + _rotateLeft((a + f + _k[i] + chunk[g]), _s[i]);
          a = temp;
        }
      }
      return '${_toHex(a)}${_toHex(b)}${_toHex(c)}${_toHex(d)}'.toUpperCase();
    } catch (_) {
      return 'unknown';
    }
  }

  static int _rotateLeft(int x, int n) => ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF;
  static final _s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  static final _k = List<int>.generate(64, (i) => (4294967296 * (i < 16 ? (i + 1) / 2 : i < 32 ? (i + 1) / 3 : i < 48 ? (i + 1) / 5 : (i + 1) / 7) % 1).floor());
  static String _toHex(int x) => x.toRadixString(16).padLeft(8, '0');

  Future<Map<String, dynamic>> _request(
      String endpoint, Map<String, dynamic> payload) async {
    final url = Uri.parse('$_baseUrl/$endpoint');
    final response = await http
        .post(url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload))
        .timeout(const Duration(seconds: 15));
    lastResponse = response.body;
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<bool> check() async {
    lastError = '';
    try {
      final data = await _request('check', {
        'group_secret': _appSecret,
        'hwid': _getHWID(),
      });
      if (data['active'] == true) return true;
      lastError = data['message'] ?? 'Device deactivated by admin';
      return false;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }

  Future<bool> register([String deviceName = '']) async {
    lastError = '';
    try {
      final payload = {
        'group_secret': _appSecret,
        'hwid': _getHWID(),
      };
      if (deviceName.isNotEmpty) payload['device_name'] = deviceName;
      final data = await _request('register', payload);
      return data['active'] == true;
    } catch (e) {
      lastError = e.toString();
      return false;
    }
  }
}
