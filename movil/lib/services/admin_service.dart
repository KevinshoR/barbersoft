import '../config/api.dart';

/// Una barbería vista desde el panel de super admin.
class AdminShop {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String subscriptionStatus;
  final String? trialEndsAt;
  final String? subscriptionEndsAt;
  final String? createdAt;
  final bool isActiveNow;
  final bool isSuperAdmin;

  AdminShop({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.subscriptionStatus,
    this.trialEndsAt,
    this.subscriptionEndsAt,
    this.createdAt,
    required this.isActiveNow,
    required this.isSuperAdmin,
  });

  factory AdminShop.fromJson(Map<String, dynamic> json) => AdminShop(
        id: json['id'] as int,
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        phone: json['phone'],
        subscriptionStatus: json['subscription_status'] ?? 'trial',
        trialEndsAt: json['trial_ends_at'],
        subscriptionEndsAt: json['subscription_ends_at'],
        createdAt: json['created_at'],
        isActiveNow: json['is_active_now'] == true,
        isSuperAdmin: json['is_super_admin'] == true,
      );
}

class AdminService {
  /// Lista TODAS las barberías registradas (solo super admin).
  static Future<List<AdminShop>> listBarbershops() async {
    final res = await Api.dio.get('/admin/barbershops');
    final data = res.data;
    final list = (data is Map && data['barbershops'] != null)
        ? data['barbershops'] as List
        : (data as List);
    return list
        .map((e) => AdminShop.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Suma [days] días a la suscripción de la barbería [id].
  static Future<void> extend({required int id, required int days}) async {
    await Api.dio.post('/admin/barbershops/$id/extend', data: {'days': days});
  }

  /// Bloquea la suscripción de la barbería [id].
  static Future<void> block({required int id}) async {
    await Api.dio.post('/admin/barbershops/$id/block');
  }
}
