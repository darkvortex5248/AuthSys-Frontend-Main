import 'dart:convert';
import 'dart:io';

import '../authsys.dart';

void report(String tag, bool ok, [String detail = '']) {
  stdout.writeln('[${ok ? 'PASS' : 'FAIL'}] $tag $detail');
}

Future<void> main() async {
  final envPath = Platform.environment['AUTHSYS_CONFIG'] ?? '../../config.json';
  final cfg = jsonDecode(await File(envPath).readAsString()) as Map<String, dynamic>;

  final auth = AuthSys(AuthSysOptions(
    appSecret: cfg['app_secret'] as String,
    appName: cfg['app_name'] as String? ?? '',
    version: cfg['app_version'] as String? ?? '',
    apiUrl: cfg['api_url'] as String,
    hwid: cfg['hwid'] as String? ?? '',
  ));

  try {
    final r = await auth.init();
    report('init', r['status'] == 'success', 'status=${r['status']}');
  } catch (e) {
    report('init', false, e.toString());
  }

  try {
    final r = await auth.login(cfg['username'] as String, cfg['password'] as String, sessionLength: 3600);
    report('login', r['success'] == true && r['token'] != null, 'user=${r['username']}');
  } catch (e) {
    report('login', false, e.toString());
  }

  try {
    final r = await auth.verify();
    report('verify', r['valid'] == true, 'user=${r['username']}');
  } catch (e) {
    report('verify', false, e.toString());
  }

  try {
    final r = await auth.licenseCheck(cfg['fake_license'] as String);
    report('license_check', r['valid'] == false, 'valid=${r['valid']} (expect False for fake key)');
  } catch (e) {
    report('license_check', false, e.toString());
  }

  try {
    final r = await auth.registerDevice(cfg['hwid'] as String, deviceName: 'SDK-Test-Device');
    report('device_register', r['active'] == true, 'device_id=${r['device_id']}');
  } catch (e) {
    report('device_register', false, e.toString());
  }

  try {
    final r = await auth.checkDevice(cfg['hwid'] as String);
    report('device_check', r['active'] == true, 'msg=${r['message']}');
  } catch (e) {
    report('device_check', false, e.toString());
  }

  try {
    final r = await auth.sendChatMessage(1, 'sdk-test');
    report('chat_send', r['status'] == 'sent', jsonEncode(r));
  } catch (e) {
    stdout.writeln('[INFO] chat_send requires room_id: $e');
  }
}