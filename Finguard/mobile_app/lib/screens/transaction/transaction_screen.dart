import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';

class TransactionScreen extends StatelessWidget {
  const TransactionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final transactions = [
      {
        'id': 'TXN001',
        'amount': '₹90,000',
        'risk': 'HIGH',
        'score': '90%',
      },
      {
        'id': 'TXN004',
        'amount': '₹45,000',
        'risk': 'HIGH',
        'score': '78%',
      },
      {
        'id': 'TXN006',
        'amount': '₹2,000',
        'risk': 'MEDIUM',
        'score': '65%',
      },
      {
        'id': 'TXN009',
        'amount': '₹1,200',
        'risk': 'LOW',
        'score': '20%',
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: transactions.length,
        itemBuilder: (context, index) {
          final transaction = transactions[index];

          final isHigh = transaction['risk'] == 'HIGH';
          final isMedium = transaction['risk'] == 'MEDIUM';

          final riskColor = isHigh
              ? Colors.red
              : isMedium
                  ? Colors.orange
                  : Colors.green;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: riskColor.withOpacity(0.15),
                child: Icon(
                  isHigh
                      ? Icons.warning
                      : isMedium
                          ? Icons.info
                          : Icons.check,
                  color: riskColor,
                ),
              ),

              title: Text(
                transaction['id']!,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),

              subtitle: Text(
                '${transaction['amount']}  •  Risk ${transaction['score']}',
              ),

              trailing: Text(
                transaction['risk']!,
                style: TextStyle(
                  color: riskColor,
                  fontWeight: FontWeight.bold,
                ),
              ),

              onTap: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.fraudResult,
                );
              },
            ),
          );
        },
      ),
    );
  }
}