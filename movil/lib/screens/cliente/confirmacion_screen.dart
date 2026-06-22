import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/appointment.dart';
import '../../models/barber.dart';
import '../../models/service.dart';
import '../../theme/app_theme.dart';
import '../role_select_screen.dart';

final _priceFormat = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

class ConfirmacionScreen extends StatelessWidget {
  final String shopName;
  final Appointment appointment;
  final Service service;
  final Barber barber;

  const ConfirmacionScreen({
    super.key,
    required this.shopName,
    required this.appointment,
    required this.service,
    required this.barber,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: AppColors.success, size: 36),
                  ),
                  const SizedBox(height: 20),
                  Text('¡Reserva confirmada!',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.playfairDisplay(
                          color: AppColors.cream, fontSize: 26, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text(
                    'Te esperamos en $shopName',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.creamDim, fontSize: 14),
                  ),
                  const SizedBox(height: 28),
                  AppCard(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _Row(label: 'Servicio', value: service.name),
                        const Divider(height: 22),
                        _Row(label: 'Barbero', value: barber.name),
                        const Divider(height: 22),
                        _Row(
                          label: 'Fecha',
                          value: DateFormat('EEEE d MMMM, yyyy', 'es')
                              .format(appointment.scheduledAt),
                        ),
                        const Divider(height: 22),
                        _Row(
                          label: 'Hora',
                          value: DateFormat('HH:mm').format(appointment.scheduledAt),
                        ),
                        const Divider(height: 22),
                        _Row(label: 'Cliente', value: appointment.clientName),
                        const Divider(height: 22),
                        _Row(label: 'Teléfono', value: appointment.clientPhone),
                        const Divider(height: 22),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total',
                                style: TextStyle(color: AppColors.creamDim, fontSize: 13)),
                            Text(
                              _priceFormat.format(service.price),
                              style: GoogleFonts.playfairDisplay(
                                  color: AppColors.gold,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const RoleSelectScreen()),
                        (route) => false,
                      ),
                      child: const Text('LISTO'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.creamDim, fontSize: 13)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
                color: AppColors.cream, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
