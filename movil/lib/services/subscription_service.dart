import '../config/api.dart';

class SubscriptionStatus {
  final String status;
  final String? trialEndsAt;
  final String? subscriptionEndsAt;

  SubscriptionStatus({required this.status, this.trialEndsAt, this.subscriptionEndsAt});

  factory SubscriptionStatus.fromJson(Map<String, dynamic> json) => SubscriptionStatus(
        status: json['subscription_status'] ?? 'trial',
        trialEndsAt: json['trial_ends_at'],
        subscriptionEndsAt: json['subscription_ends_at'],
      );
}

class SubscriptionService {
  static Future<SubscriptionStatus> getStatus() async {
    final res = await Api.dio.get('/subscription/status');
    return SubscriptionStatus.fromJson(res.data as Map<String, dynamic>);
  }
}
