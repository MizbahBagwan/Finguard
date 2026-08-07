import 'package:flutter/material.dart';

class FraudResultScreen extends StatelessWidget {
  const FraudResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fraud Result')),
      body: const Center(child: Text('Fraud analysis result')),
    );
  }
}
