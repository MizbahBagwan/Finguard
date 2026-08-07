import 'package:flutter/material.dart';

class AppProvider extends ChangeNotifier {
  String status = 'Ready';

  void updateStatus(String value) {
    status = value;
    notifyListeners();
  }
}
