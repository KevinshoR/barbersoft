import '../config/api.dart';
import '../models/barber.dart';

class BarberService {
  static Future<List<Barber>> getAll() async {
    final res = await Api.dio.get('/barbers');
    final list = (res.data['barbers'] as List).cast<Map<String, dynamic>>();
    return list.map(Barber.fromJson).toList();
  }

  static Future<Barber> create({
    required String name,
    String? photoUrl,
    String? specialty,
    String? workDays,
  }) async {
    final res = await Api.dio.post(
      '/barbers',
      data: {
        'name': name,
        if (photoUrl != null && photoUrl.isNotEmpty) 'photo_url': photoUrl,
        if (specialty != null && specialty.isNotEmpty) 'specialty': specialty,
        if (workDays != null && workDays.isNotEmpty) 'work_days': workDays,
      },
    );
    return Barber.fromJson(res.data['barber'] as Map<String, dynamic>);
  }

  static Future<Barber> update(
    int id, {
    String? name,
    String? photoUrl,
    String? specialty,
    String? workDays,
    bool? active,
  }) async {
    final res = await Api.dio.put(
      '/barbers/$id',
      data: {
        if (name != null) 'name': name,
        if (photoUrl != null) 'photo_url': photoUrl,
        if (specialty != null) 'specialty': specialty,
        if (workDays != null) 'work_days': workDays,
        if (active != null) 'active': active,
      },
    );
    return Barber.fromJson(res.data['barber'] as Map<String, dynamic>);
  }

  static Future<void> remove(int id) async {
    await Api.dio.delete('/barbers/$id');
  }
}
