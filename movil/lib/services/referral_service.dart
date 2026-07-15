import '../config/api.dart';

class ReferralStats {
  final String referralCode;
  final int totalReferidos;
  final int referidosConPago;

  ReferralStats({
    required this.referralCode,
    required this.totalReferidos,
    required this.referidosConPago,
  });

  factory ReferralStats.fromJson(Map<String, dynamic> json) => ReferralStats(
    referralCode: json['referral_code'] ?? '',
    totalReferidos: (json['total_referidos'] as num?)?.toInt() ?? 0,
    referidosConPago: (json['referidos_con_pago'] as num?)?.toInt() ?? 0,
  );
}

class ReferralService {
  static Future<ReferralStats> getMyReferrals() async {
    final res = await Api.dio.get('/referrals/me');
    return ReferralStats.fromJson(res.data as Map<String, dynamic>);
  }
}
