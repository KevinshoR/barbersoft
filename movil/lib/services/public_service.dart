import 'package:dio/dio.dart';
import '../config/api.dart';
import '../models/appointment.dart';
import '../models/public_shop_info.dart';

/// Endpoints públicos (/api/public/:slug/...) — no requieren login.
/// Usados por el flujo de CLIENTE para reservar indicando el slug de la barbería.
class PublicService {
  // Dio sin el interceptor de Authorization, para no enviar tokens de admin
  // por error en peticiones públicas (y para que funcionen aunque no haya sesión).
  static Dio get _dio {
    final dio = Dio(BaseOptions(
      baseUrl: Api.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));
    return dio;
  }

  static Future<PublicShopData> getShopInfo(String slug) async {
    final res = await _dio.get('/public/$slug');
    return PublicShopData.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<List<OccupiedSlot>> getAvailability({
    required String slug,
    required int barberId,
    required DateTime date,
  }) async {
    final res = await _dio.get('/public/$slug/availability', queryParameters: {
      'barber_id': barberId,
      'date': _dateOnly(date),
    });
    final list = (res.data['occupied'] as List).cast<Map<String, dynamic>>();
    return list.map(OccupiedSlot.fromJson).toList();
  }

  static Future<Appointment> book({
    required String slug,
    required int barberId,
    required int serviceId,
    required String clientName,
    required String clientPhone,
    String? clientEmail,
    required DateTime scheduledAt,
    String? notes,
  }) async {
    final res = await _dio.post('/public/$slug/book', data: {
      'barber_id': barberId,
      'service_id': serviceId,
      'client_name': clientName,
      'client_phone': clientPhone,
      if (clientEmail != null && clientEmail.isNotEmpty) 'client_email': clientEmail,
      'scheduled_at': scheduledAt.toUtc().toIso8601String(),
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return Appointment.fromJson(res.data['appointment'] as Map<String, dynamic>);
  }

  static Future<({String shopName, List<Appointment> appointments})> misCitas({
    required String slug,
    required String phone,
  }) async {
    final res = await _dio.get('/public/$slug/mis-citas', queryParameters: {
      'phone': phone,
    });
    final shopName = (res.data['shop'] as Map<String, dynamic>)['name'] as String? ?? '';
    final list = (res.data['appointments'] as List).cast<Map<String, dynamic>>();
    return (shopName: shopName, appointments: list.map(Appointment.fromJson).toList());
  }

  static Future<void> cancelCita({
    required String slug,
    required int id,
    required String phone,
  }) async {
    await _dio.patch('/public/$slug/mis-citas/$id/cancel', data: {'phone': phone});
  }

  static String _dateOnly(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
