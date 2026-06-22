import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class Api {
  // En el navegador (Flutter web) -> localhost.
  // En el emulador Android        -> 10.0.2.2 (el localhost del PC visto desde el emulador).
  static final String baseUrl = kIsWeb
      ? 'http://localhost:3000/api'
      : 'http://10.0.2.2:3000/api';

  static final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));

  static void setToken(String? token) {
    if (token == null) {
      dio.options.headers.remove('Authorization');
    } else {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }
}