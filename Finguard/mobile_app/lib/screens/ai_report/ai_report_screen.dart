import 'package:flutter/material.dart';

class AiReportScreen extends StatelessWidget {
  const AiReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Report')),
      body: const Center(child: Text('AI-generated insights')),
    );
  }
}
