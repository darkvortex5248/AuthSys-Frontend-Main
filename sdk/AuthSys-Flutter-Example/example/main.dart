import 'dart:io';
import '../lib/authsys.dart';

void main() async {
  final client = AuthSysClient(
    appSecret: 'your_app_secret',
    version: '1.0',
    apiUrl: 'https://authsys-main-production.up.railway.app/api/v1',
  );

  stdout.writeln('\n Connecting..');
  await client.init();

  if (!client.initialized) {
    stdout.writeln('\n Status: ${client.lastError}');
    await Future.delayed(const Duration(milliseconds: 1500));
    exit(0);
  }

  stdout.writeln('\n [1] Login\n [2] Register\n [3] License key only\n');
  stdout.write(' Choose option: ');
  final option = int.tryParse(stdin.readLineSync() ?? '') ?? 0;

  String? username, password, key;

  switch (option) {
    case 1:
      stdout.write('\n Enter username: ');
      username = stdin.readLineSync() ?? '';
      stdout.write('\n Enter password: ');
      password = stdin.readLineSync() ?? '';
      await client.login(username, password);
      break;
    case 2:
      stdout.write('\n Enter username: ');
      username = stdin.readLineSync() ?? '';
      stdout.write('\n Enter password: ');
      password = stdin.readLineSync() ?? '';
      stdout.write('\n Enter license: ');
      key = stdin.readLineSync() ?? '';
      await client.register(username, password, key);
      break;
    case 3:
      stdout.write('\n Enter license: ');
      key = stdin.readLineSync() ?? '';
      await client.licenseLogin(key);
      break;
    default:
      stdout.writeln('\n Invalid option');
      exit(0);
  }

  if (client.sessionToken != null || client.lastResponse['message'] == 'User registered successfully') {
    stdout.writeln('\n Success! ${client.lastResponse['message'] ?? 'Logged in successfully.'}');

    final motd = client.var('motd');
    if (motd != null) {
      stdout.writeln('\n MOTD: $motd');
    }

    stdout.writeln('\n [Main Application Running...]');
  } else {
    stdout.writeln('\n Failed: ${client.lastError}');
  }

  stdin.readLineSync();
}
