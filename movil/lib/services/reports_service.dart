import '../config/api.dart';

class TopItem {
  final String? name;
  final int count;
  TopItem({this.name, required this.count});

  factory TopItem.fromJson(Map<String, dynamic> json) => TopItem(
    name: json['name'] as String?,
    count: (json['count'] as num?)?.toInt() ?? 0,
  );
}

class MonthlyReport {
  final num revenue;
  final TopItem? topBarber;
  final TopItem? topService;

  MonthlyReport({required this.revenue, this.topBarber, this.topService});

  factory MonthlyReport.fromJson(Map<String, dynamic> json) => MonthlyReport(
    revenue: (json['revenue'] as num?) ?? 0,
    topBarber: json['topBarber'] == null
        ? null
        : TopItem.fromJson(json['topBarber'] as Map<String, dynamic>),
    topService: json['topService'] == null
        ? null
        : TopItem.fromJson(json['topService'] as Map<String, dynamic>),
  );
}

class ReportsService {
  // Sin parámetros = mes actual (así lo interpreta el backend).
  static Future<MonthlyReport> getMonthly() async {
    final res = await Api.dio.get('/reports/monthly');
    return MonthlyReport.fromJson(res.data as Map<String, dynamic>);
  }
}
