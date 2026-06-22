import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api.dart';
import '../models/barbershop.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  Barbershop? _barbershop;

  String? get token => _token;
  Barbershop? get barbershop => _barbershop;
  bool get isLoggedIn => _token != null;

  // Restaura la sesión guardada al abrir la app
  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final shopJson = prefs.getString('barbershop');
    if (token != null && shopJson != null) {
      _token = token;
      _barbershop = Barbershop.fromJson(jsonDecode(shopJson));
      Api.setToken(token);
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final result = await AuthService.login(email, password);
    _token = result.token;
    _barbershop = result.barbershop;
    Api.setToken(_token);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('barbershop', jsonEncode(_barbershop!.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _barbershop = null;
    Api.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('barbershop');
    notifyListeners();
  }
}