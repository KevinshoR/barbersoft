class Barber {
  final int id;
  final String name;
  final String? photoUrl;
  final String? specialty;
  final String? workDays;
  final bool active;

  Barber({
    required this.id,
    required this.name,
    this.photoUrl,
    this.specialty,
    this.workDays,
    this.active = true,
  });

  factory Barber.fromJson(Map<String, dynamic> json) {
    return Barber(
      id: json['id'] as int,
      name: json['name'] ?? '',
      photoUrl: json['photo_url'],
      specialty: json['specialty'],
      workDays: json['work_days'],
      active: json['active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'photo_url': photoUrl,
    'specialty': specialty,
    'work_days': workDays,
    'active': active,
  };
}
