import 'barber.dart';
import 'service.dart';

class ShopInfo {
  final int id;
  final String name;
  final String? phone;
  final String? address;
  final String slug;

  ShopInfo({
    required this.id,
    required this.name,
    this.phone,
    this.address,
    required this.slug,
  });

  factory ShopInfo.fromJson(Map<String, dynamic> json) => ShopInfo(
        id: json['id'] as int,
        name: json['name'] ?? '',
        phone: json['phone'],
        address: json['address'],
        slug: json['slug'] ?? '',
      );
}

class BusinessHour {
  final String day;
  final int dayOfWeek;
  final String openTime;
  final String closeTime;
  final bool isOpen;

  BusinessHour({
    required this.day,
    required this.dayOfWeek,
    required this.openTime,
    required this.closeTime,
    required this.isOpen,
  });

  factory BusinessHour.fromJson(Map<String, dynamic> json) => BusinessHour(
        day: json['day'] ?? '',
        dayOfWeek: json['day_of_week'] as int,
        openTime: json['open_time'] ?? '',
        closeTime: json['close_time'] ?? '',
        isOpen: json['is_open'] ?? false,
      );
}

class PublicShopData {
  final ShopInfo shop;
  final List<Barber> barbers;
  final List<Service> services;
  final List<BusinessHour> hours;

  PublicShopData({
    required this.shop,
    required this.barbers,
    required this.services,
    required this.hours,
  });

  factory PublicShopData.fromJson(Map<String, dynamic> json) => PublicShopData(
        shop: ShopInfo.fromJson(json['shop'] as Map<String, dynamic>),
        barbers: (json['barbers'] as List)
            .cast<Map<String, dynamic>>()
            .map(Barber.fromJson)
            .toList(),
        services: (json['services'] as List)
            .cast<Map<String, dynamic>>()
            .map(Service.fromJson)
            .toList(),
        hours: (json['hours'] as List)
            .cast<Map<String, dynamic>>()
            .map(BusinessHour.fromJson)
            .toList(),
      );
}

class OccupiedSlot {
  final DateTime start;
  final int duration;

  OccupiedSlot({required this.start, required this.duration});

  factory OccupiedSlot.fromJson(Map<String, dynamic> json) => OccupiedSlot(
        start: DateTime.parse(json['start']).toLocal(),
        duration: (json['duration'] as num).toInt(),
      );
}
