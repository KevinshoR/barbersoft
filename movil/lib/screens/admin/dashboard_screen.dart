import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/appointment.dart';
import '../../providers/auth_provider.dart';
import '../../services/appointment_service.dart';
import '../../theme/app_theme.dart';
import '../role_select_screen.dart';
import 'suscripcion_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Appointment>? _today;
  bool _loadError = false;
  bool _copied = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = false);
    try {
      final list = await AppointmentService.getAll(date: DateTime.now());
      if (!mounted) return;
      setState(() => _today = list);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadError = true);
    }
  }

  int _trialDaysLeft(String? trialEndsAt) {
    if (trialEndsAt == null) return 0;
    final end = DateTime.tryParse(trialEndsAt);
    if (end == null) return 0;
    final diff = end.difference(DateTime.now()).inHours / 24;
    return diff.ceil().clamp(0, 9999);
  }

  String _formatTime(DateTime d) {
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _capitalizedDate() {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const weekdays = [
      'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
    ];
    final now = DateTime.now();
    return '${weekdays[now.weekday - 1]}, ${now.day} de ${months[now.month - 1]} de ${now.year}';
  }

  Future<void> _copyLink(String slug) async {
    await Clipboard.setData(ClipboardData(text: '/reservar/$slug'));
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<AuthProvider>().barbershop;
    final isTrial = shop?.subscriptionStatus == 'trial';
    final daysLeft = _trialDaysLeft(shop?.trialEndsAt);

    final pending = _today?.where((a) => a.status == 'pending').length ?? 0;
    final confirmed = _today?.where((a) => a.status == 'confirmed').length ?? 0;
    final total = _today?.length ?? 0;

    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(
        title: const Text('Inicio'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Cerrar sesión',
            onPressed: () => _confirmLogout(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.gold,
        backgroundColor: AppColors.dark2,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (isTrial) _TrialBanner(daysLeft: daysLeft),
            if (isTrial) const SizedBox(height: 20),
            Text(
              _capitalizedDate().toUpperCase(),
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Hola, ${shop?.name.split(' ').first ?? ''}',
              style: GoogleFonts.playfairDisplay(
                color: AppColors.cream,
                fontSize: 32,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 14),
            if (shop?.slug != null)
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.dark2,
                    border: Border.all(color: AppColors.dark4),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.link, size: 14, color: AppColors.creamDim),
                      const SizedBox(width: 8),
                      Text(
                        '/reservar/${shop!.slug}',
                        style: const TextStyle(
                            color: AppColors.creamDim, fontSize: 12, fontFamily: 'monospace'),
                      ),
                      const SizedBox(width: 10),
                      GestureDetector(
                        onTap: () => _copyLink(shop.slug!),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _copied
                                ? AppColors.success.withValues(alpha: 0.15)
                                : AppColors.dark3,
                            border: Border.all(
                                color: _copied
                                    ? AppColors.success.withValues(alpha: 0.3)
                                    : AppColors.dark4),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _copied ? '✓ COPIADO' : 'COPIAR',
                            style: TextStyle(
                              color: _copied ? AppColors.success : AppColors.creamDim,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                    child: _StatCard(
                        label: 'CITAS HOY', value: total, color: AppColors.gold)),
                const SizedBox(width: 12),
                Expanded(
                    child: _StatCard(
                        label: 'PENDIENTES', value: pending, color: AppColors.goldLight)),
                const SizedBox(width: 12),
                Expanded(
                    child: _StatCard(
                        label: 'CONFIRMADAS', value: confirmed, color: AppColors.success)),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              decoration: BoxDecoration(
                color: AppColors.dark2,
                border: Border.all(color: AppColors.dark4),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                    child: Text('Citas de hoy',
                        style: GoogleFonts.dmSans(
                            color: AppColors.cream,
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                  ),
                  const Divider(height: 1),
                  if (_loadError)
                    Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        children: [
                          const Icon(Icons.cloud_off, color: AppColors.creamDim, size: 32),
                          const SizedBox(height: 10),
                          const Text('No se pudo conectar con el servidor',
                              style: TextStyle(color: AppColors.creamDim, fontSize: 13)),
                          const SizedBox(height: 12),
                          TextButton(onPressed: _load, child: const Text('Reintentar')),
                        ],
                      ),
                    )
                  else if (_today == null)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.gold)),
                    )
                  else if (_today!.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(
                        child: Text('No hay citas para hoy',
                            style: TextStyle(color: AppColors.creamDim, fontSize: 14)),
                      ),
                    )
                  else
                    ..._today!.asMap().entries.map((entry) {
                      final i = entry.key;
                      final a = entry.value;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        decoration: BoxDecoration(
                          border: i < _today!.length - 1
                              ? const Border(bottom: BorderSide(color: AppColors.dark3))
                              : null,
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.dark3,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              constraints: const BoxConstraints(minWidth: 56),
                              child: Text(
                                _formatTime(a.scheduledAt),
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    color: AppColors.gold,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(a.clientName,
                                      style: const TextStyle(
                                          color: AppColors.cream,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14)),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${a.serviceName ?? ''} · ${a.barberName ?? ''}',
                                    style: const TextStyle(
                                        color: AppColors.creamDim, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            StatusBadge(status: a.status),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cerrar sesión'),
        content: const Text('¿Seguro que querés salir de tu cuenta?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar',
                  style: TextStyle(color: AppColors.creamDim))),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (!context.mounted) return;
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const RoleSelectScreen()),
                (route) => false,
              );
            },
            child: const Text('Salir', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _TrialBanner extends StatelessWidget {
  final int daysLeft;
  const _TrialBanner({required this.daysLeft});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.gold.withValues(alpha: 0.15), AppColors.gold.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('◆ Período de prueba — $daysLeft días restantes',
                    style: const TextStyle(
                        color: AppColors.gold, fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 2),
                const Text('Activá tu suscripción para mantener el acceso',
                    style: TextStyle(color: AppColors.creamDim, fontSize: 11)),
              ],
            ),
          ),
          TextButton(
            style: TextButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: AppColors.dark,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SuscripcionScreen()),
            ),
            child: const Text('VER PLANES', style: TextStyle(fontSize: 11)),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: BoxDecoration(
        color: AppColors.dark2,
        border: Border.all(color: AppColors.dark4),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 2, width: 24, color: color.withValues(alpha: 0.7)),
          const SizedBox(height: 12),
          Text(label,
              style: const TextStyle(
                  color: AppColors.creamDim,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.6)),
          const SizedBox(height: 8),
          Text('$value',
              style: GoogleFonts.playfairDisplay(
                  color: color, fontSize: 30, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
