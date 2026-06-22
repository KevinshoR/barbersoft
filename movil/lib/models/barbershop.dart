class Barbershop {
  final int id;
  final String name;
  final String email;
  final String? slug;
  final String? phone;
  final String? address;
  final String? subscriptionStatus;
  final String? trialEndsAt;
  final String? subscriptionEndsAt;
  final String? currentPlan;

  Barbershop({
    required this.id,
    required this.name,
    required this.email,
    this.slug,
    this.phone,
    this.address,
    this.subscriptionStatus,
    this.trialEndsAt,
    this.subscriptionEndsAt,
    this.currentPlan,
  });

  factory Barbershop.fromJson(Map<String, dynamic> json) {
    return Barbershop(
      id: json['id'] as int,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      slug: json['slug'],
      phone: json['phone'],
      address: json['address'],
      subscriptionStatus: json['subscription_status'],
      trialEndsAt: json['trial_ends_at'],
      subscriptionEndsAt: json['subscription_ends_at'],
      currentPlan: json['current_plan'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'slug': slug,
        'phone': phone,
        'address': address,
        'subscription_status': subscriptionStatus,
        'trial_ends_at': trialEndsAt,
        'subscription_ends_at': subscriptionEndsAt,
        'current_plan': currentPlan,
      };
}
