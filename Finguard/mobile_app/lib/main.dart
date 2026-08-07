import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const FinGuardApp());
}

class FinGuardApp extends StatelessWidget {
  const FinGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FinGuard AI',
      theme: AppTheme.lightTheme,
      home: const Scaffold(
        body: Center(
          child: Text('FinGuard AI is ready'),
        ),
      ),
    );
  }
}
