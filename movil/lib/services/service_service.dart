import '../config/api.dart';
import '../models/service.dart';

class ServiceService {
  static Future<List<Service>> getAll() async {
    final res = await Api.dio.get('/services');
    final list = (res.data['services'] as List).cast<Map<String, dynamic>>();
    return list.map(Service.fromJson).toList();
  }

  static Future<Service> create({
    required String name,
    required int durationMin,
    required num price,
    String? imageUrl,
    String? description,
  }) async {
    final res = await Api.dio.post(
      '/services',
      data: {
        'name': name,
        'duration_min': durationMin,
        'price': price,
        if (imageUrl != null && imageUrl.isNotEmpty) 'image_url': imageUrl,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
    );
    return Service.fromJson(res.data['service'] as Map<String, dynamic>);
  }

  static Future<Service> update(
    int id, {
    String? name,
    int? durationMin,
    num? price,
    bool? active,
    String? imageUrl,
    String? description,
  }) async {
    final res = await Api.dio.put(
      '/services/$id',
      data: {
        if (name != null) 'name': name,
        if (durationMin != null) 'duration_min': durationMin,
        if (price != null) 'price': price,
        if (active != null) 'active': active,
        if (imageUrl != null) 'image_url': imageUrl,
        if (description != null) 'description': description,
      },
    );
    return Service.fromJson(res.data['service'] as Map<String, dynamic>);
  }

  static Future<void> remove(int id) async {
    await Api.dio.delete('/services/$id');
  }
}
