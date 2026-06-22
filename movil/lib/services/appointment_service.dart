import '../config/api.dart';
import '../models/appointment.dart';

/// Citas del lado ADMIN (requieren auth). Para el flujo de reserva pública del
/// cliente sin login, ver PublicService.
class AppointmentService {
  static Future<List<Appointment>> getAll({DateTime? date}) async {
    final res = await Api.dio.get('/appointments', queryParameters: {
      if (date != null) 'date': _dateOnly(date),
    });
    final list = (res.data['appointments'] as List).cast<Map<String, dynamic>>();
    return list.map(Appointment.fromJson).toList();
  }

  static Future<Appointment> create({
    required int barberId,
    required int serviceId,
    required String clientName,
    required String clientPhone,
    String? clientEmail,
    required DateTime scheduledAt,
    String? notes,
  }) async {
    final res = await Api.dio.post('/appointments', data: {
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

  static Future<Appointment> updateStatus(int id, String status) async {
    final res = await Api.dio.patch('/appointments/$id', data: {'status': status});
    return Appointment.fromJson(res.data['appointment'] as Map<String, dynamic>);
  }

  static Future<void> remove(int id) async {
    await Api.dio.delete('/appointments/$id');
  }

  static String _dateOnly(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
