import 'package:flutter/material.dart';
import 'package:authsys/authsys.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AuthSys Flutter Example',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const AuthPage(),
    );
  }
}

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final auth = AuthSys(AuthSysOptions(
    appSecret: 'YOUR_APP_SECRET',
    appName: 'MyApplication',
    version: '1.0.0',
    enableLogging: true,
  ));

  String _status = 'Not initialized';
  String _username = '';
  String _token = '';

  Future<void> _init() async {
    try {
      await auth.init();
      setState(() {
        _status = 'Initialized: ${auth.isInitialized}';
      });
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }

  Future<void> _login() async {
    try {
      final result = await auth.login('testuser', 'Password123!');
      setState(() {
        _status = 'Login: ${result['success']}';
        _username = result['username'] ?? '';
        _token = result['token'] ?? '';
      });
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }

  Future<void> _verify() async {
    try {
      final result = await auth.verify();
      setState(() => _status = 'Verify: ${result['valid']}');
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }

  Future<void> _logout() async {
    auth.logout();
    setState(() {
      _status = 'Logged out';
      _username = '';
      _token = '';
    });
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AuthSys Flutter Example')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_status),
            if (_username.isNotEmpty) Text('Username: $_username'),
            if (_token.isNotEmpty) Text('Token: $_token')),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: [
                ElevatedButton(onPressed: _login, child: const Text('Login')),
                ElevatedButton(onPressed: _verify, child: const Text('Verify')),
                ElevatedButton(onPressed: _logout, child: const Text('Logout')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
