import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/public_shop_info.dart';
import '../../services/public_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';
import 'reservar_screen.dart';

/// Primer paso del flujo CLIENTE: ingresar el código/slug de la barbería
/// para reservar un turno, sin necesidad de loguearse.
class EnterShopScreen extends StatefulWidget {
  const EnterShopScreen({super.key});

  @override
  State<EnterShopScreen> createState() => _EnterShopScreenState();
}

class _EnterShopScreenState extends State<EnterShopScreen> {
  final _formKey = GlobalKey<FormState>();
  final _slugCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _slugCtrl.dispose();
    super.dispose();
  }

  String? _validateSlug(String? v) {
    final value = v?.trim() ?? '';
    if (value.isEmpty) return 'Ingresá el código de la barbería';
    return null;
  }

  Future<void> _continue() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final slug = _slugCtrl.text.trim().toLowerCase().replaceAll(' ', '-');
    setState(() => _loading = true);
    try {
      final PublicShopData data = await PublicService.getShopInfo(slug);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ReservarScreen(shopData: data)),
      );
    } catch (e) {
      setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(title: const Text('Reservar turno')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(Icons.content_cut, color: AppColors.gold, size: 36),
                    const SizedBox(height: 16),
                    Text(
                      '¿En qué barbería querés reservar?',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.playfairDisplay(
                          color: AppColors.cream, fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ingresá el código de reserva que te dio tu barbería',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(color: AppColors.creamDim, fontSize: 13),
                    ),
                    const SizedBox(height: 28),
                    TextFormField(
                      controller: _slugCtrl,
                      textInputAction: TextInputAction.go,
                      autocorrect: false,
                      style: const TextStyle(color: AppColors.cream),
                      decoration: const InputDecoration(
                        hintText: 'mi-barberia',
                        prefixIcon: Icon(Icons.link, color: AppColors.creamDim, size: 18),
                      ),
                      validator: _validateSlug,
                      onFieldSubmitted: (_) => _continue(),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.1),
                          border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_error!,
                                  style:
                                      const TextStyle(color: AppColors.danger, fontSize: 13)),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _loading ? null : _continue,
                      child: _loading
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: AppColors.dark))
                          : const Text('CONTINUAR'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
