num _toNum(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v;
  return num.tryParse(v.toString()) ?? 0;
}

class Appointment {
  final int? id;
  final int? barberId;
  final int? serviceId;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final DateTime scheduledAt;
  final String status;
  final String? notes;
  // Campos que vienen "joineados" en /api/appointments y /api/public/:slug/mis-citas
  final String? barberName;
  final String? serviceName;
  final int? durationMin;
  final num? price;

  Appointment({
    this.id,
    this.barberId,
    this.serviceId,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    required this.scheduledAt,
    this.status = 'pending',
    this.notes,
    this.barberName,
    this.serviceName,
    this.durationMin,
    this.price,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as int?,
      barberId: json['barber_id'] as int?,
      serviceId: json['service_id'] as int?,
      clientName: json['client_name'] ?? '',
      clientPhone: json['client_phone'] ?? '',
      clientEmail: json['client_email'],
      scheduledAt: DateTime.parse(json['scheduled_at']).toLocal(),
      status: json['status'] ?? 'pending',
      notes: json['notes'],
      barberName: json['barber_name'],
      serviceName: json['service_name'],
      durationMin: json['duration_min'] == null ? null : _toNum(json['duration_min']).toInt(),
      price: json['price'] == null ? null : _toNum(json['price']),
    );
  }
}
