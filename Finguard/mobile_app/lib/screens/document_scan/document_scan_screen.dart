import 'package:flutter/material.dart';

class DocumentScanScreen extends StatelessWidget {
  const DocumentScanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Document Scan')),
      body: const Center(child: Text('Scan documents here')),
    );
  }
}
