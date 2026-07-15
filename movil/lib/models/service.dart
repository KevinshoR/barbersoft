num _toNum(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v;
  return num.tryParse(v.toString()) ?? 0;
}

class Service {
  final int id;
  final String name;
  final int durationMin;
  final num price;
  final bool active;
  final String? imageUrl;
  final String? description;

  Service({
    required this.id,
    required this.name,
    required this.durationMin,
    required this.price,
    this.active = true,
    this.imageUrl,
    this.description,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id'] as int,
      name: json['name'] ?? '',
      durationMin: _toNum(json['duration_min']).toInt(),
      price: _toNum(json['price']),
      active: json['active'] ?? true,
      imageUrl: json['image_url'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'duration_min': durationMin,
    'price': price,
    'active': active,
    'image_url': imageUrl,
    'description': description,
  };
}
