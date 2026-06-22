import '../config/api.dart';
import '../models/barbershop.dart';

class AuthResult {
  final String token;
  final Barbershop barbershop;
  AuthResult({required this.token, required this.barbershop});
}

class AuthService {
  static Future<AuthResult> login(String email, String password) async {
    final res = await Api.dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    return AuthResult(
      token: data['token'] as String,
      barbershop: Barbershop.fromJson(data['barbershop'] as Map<String, dynamic>),
    );
  }

  static Future<Barbershop> getMe() async {
    final res = await Api.dio.get('/auth/me');
    return Barbershop.fromJson(res.data['barbershop'] as Map<String, dynamic>);
  }
}
