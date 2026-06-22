import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/subscription_service.dart';
import '../../theme/app_theme.dart';

class SuscripcionScreen extends StatefulWidget {
  const SuscripcionScreen({super.key});

  @override
  State<SuscripcionScreen> createState() => _SuscripcionScreenState();
}

class _SuscripcionScreenState extends State<SuscripcionScreen> {
  SubscriptionStatus? _status;
  bool _loadError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = false);
    try {
      final status = await SubscriptionService.getStatus();
      if (!mounted) return;
      setState(() => _status = status);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadError = true);
    }
  }

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    final d = DateTime.tryParse(iso);
    if (d == null) return '—';
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return '${d.day} de ${months[d.month - 1]} de ${d.year}';
  }

  int _daysLeft(String? iso) {
    if (iso == null) return 0;
    final d = DateTime.tryParse(iso);
    if (d == null) return 0;
    final diff = d.difference(DateTime.now()).inHours / 24;
    return diff.ceil().clamp(0, 9999);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(title: const Text('Suscripción')),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.gold,
        backgroundColor: AppColors.dark2,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loadError) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          const Icon(Icons.cloud_off, color: AppColors.creamDim, size: 36),
          const SizedBox(height: 12),
          const Center(
              child: Text('No se pudo conectar con el servidor',
                  style: TextStyle(color: AppColors.creamDim))),
          const SizedBox(height: 12),
          Center(child: TextButton(onPressed: _load, child: const Text('Reintentar'))),
        ],
      );
    }
    if (_status == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }

    final status = _status!.status;
    final isTrial = status == 'trial';
    final isActive = status == 'active';

    final statusColor = isActive
        ? AppColors.success
        : isTrial
            ? AppColors.gold
            : AppColors.danger;
    final statusLabel = isActive
        ? 'ACTIVA'
        : isTrial
            ? 'PERÍODO DE PRUEBA'
            : 'BLOQUEADA';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        AppCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(statusLabel,
                    style: TextStyle(
                        color: statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 16),
              if (isTrial) ...[
                Text('${_daysLeft(_status!.trialEndsAt)} días restantes',
                    style: GoogleFonts.playfairDisplay(
                        color: AppColors.cream, fontSize: 26, fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                Text('Tu período de prueba termina el ${_formatDate(_status!.trialEndsAt)}',
                    style: const TextStyle(color: AppColors.creamDim, fontSize: 13)),
              ] else if (isActive) ...[
                Text('Suscripción activa',
                    style: GoogleFonts.playfairDisplay(
                        color: AppColors.cream, fontSize: 26, fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                Text('Vence el ${_formatDate(_status!.subscriptionEndsAt)}',
                    style: const TextStyle(color: AppColors.creamDim, fontSize: 13)),
              ] else ...[
                Text('Cuenta bloqueada',
                    style: GoogleFonts.playfairDisplay(
                        color: AppColors.cream, fontSize: 26, fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                const Text('Renová tu suscripción para recuperar el acceso',
                    style: TextStyle(color: AppColors.creamDim, fontSize: 13)),
              ],
              const SizedBox(height: 20),
              if (!isActive)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Activar suscripción'),
                        content: const Text(
                            'Para gestionar el pago de tu plan, ingresá a tu panel desde la web de Barbersoft.'),
                        actions: [
                          TextButton(
                              onPressed: () => Navigator.pop(ctx),
                              child: const Text('Entendido')),
                        ],
                      ),
                    ),
                    child: const Text('VER PLANES'),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text('PLANES DISPONIBLES',
            style: const TextStyle(
                color: AppColors.creamDim,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1)),
        const SizedBox(height: 12),
        _PlanCard(
          label: 'MENSUAL',
          price: '\$89.900',
          period: 'mes',
          billing: 'Facturado mensualmente',
          features: const [
            'Citas ilimitadas',
            'Barberos ilimitados',
            'Página de reservas pública',
            'Recordatorios automáticos WhatsApp',
            'Reportes mensuales',
          ],
        ),
        const SizedBox(height: 12),
        _PlanCard(
          label: 'ANUAL',
          price: '\$69.900',
          period: 'mes',
          billing: 'Facturado anualmente · ahorrás \$240.000',
          popular: true,
          features: const [
            'Todo lo del plan mensual',
            '2 meses gratis',
            'Soporte prioritario',
            'Acceso anticipado a funciones',
            'Reportes avanzados',
          ],
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String label;
  final String price;
  final String period;
  final String billing;
  final List<String> features;
  final bool popular;

  const _PlanCard({
    required this.label,
    required this.price,
    required this.period,
    required this.billing,
    required this.features,
    this.popular = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.dark2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: popular ? AppColors.gold : AppColors.dark4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(label,
                  style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1)),
              if (popular) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: const Text('MÁS POPULAR',
                      style: TextStyle(
                          color: AppColors.dark, fontSize: 9, fontWeight: FontWeight.w800)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(price,
                  style: GoogleFonts.playfairDisplay(
                      color: AppColors.cream, fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text('/$period',
                    style: const TextStyle(color: AppColors.creamDim, fontSize: 13)),
              ),
            ],
          ),
          Text(billing, style: const TextStyle(color: AppColors.creamDim, fontSize: 12)),
          const SizedBox(height: 14),
          ...features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.check, color: AppColors.success, size: 14),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(f,
                          style: const TextStyle(color: AppColors.cream, fontSize: 13)),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
