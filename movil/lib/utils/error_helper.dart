import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Convierte cualquier error de red en un mensaje entendible para el usuario.
/// El backend responde `{ "error": "..." }`; si no hay conexión (server apagado,
/// sin internet, timeout) se devuelve un mensaje amable en vez de dejar caer la app.
String errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'El servidor no respondió. Probá de nuevo en un momento.';
      case DioExceptionType.connectionError:
        return 'No se pudo conectar con el servidor. Verificá tu conexión.';
      default:
        return 'Ocurrió un error inesperado. Intentá de nuevo.';
    }
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

void showErrorSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(message)),
        ],
      ),
    ));
}

void showSuccessSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: AppColors.success, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(message)),
        ],
      ),
    ));
}
