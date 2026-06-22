class Barber {
  final int id;
  final String name;
  final String? photoUrl;
  final bool active;

  Barber({
    required this.id,
    required this.name,
    this.photoUrl,
    this.active = true,
  });

  factory Barber.fromJson(Map<String, dynamic> json) {
    return Barber(
      id: json['id'] as int,
      name: json['name'] ?? '',
      photoUrl: json['photo_url'],
      active: json['active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'photo_url': photoUrl,
        'active': active,
      };
}
