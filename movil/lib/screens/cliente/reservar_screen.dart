import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/barber.dart';
import '../../models/public_shop_info.dart';
import '../../models/service.dart';
import '../../services/public_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';
import 'confirmacion_screen.dart';

final _priceFormat = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

/// Pantalla de reserva estilo Calendly: el cliente elige servicio, barbero,
/// fecha y hora disponible, y deja nombre + teléfono. No requiere cuenta.
class ReservarScreen extends StatefulWidget {
  final PublicShopData shopData;
  const ReservarScreen({super.key, required this.shopData});

  @override
  State<ReservarScreen> createState() => _ReservarScreenState();
}

class _ReservarScreenState extends State<ReservarScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  Service? _service;
  Barber? _barber;
  DateTime? _date;
  DateTime? _slot;

  List<DateTime>? _availableSlots;
  bool _loadingSlots = false;
  String? _slotsMessage;

  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
    );
    if (picked == null) return;
    setState(() {
      _date = picked;
      _slot = null;
      _availableSlots = null;
      _slotsMessage = null;
    });
    if (_barber != null && _service != null) _loadSlots();
  }

  void _onServiceChanged(Service s) {
    setState(() {
      _service = s;
      _slot = null;
      _availableSlots = null;
      _slotsMessage = null;
    });
    if (_barber != null && _date != null) _loadSlots();
  }

  void _onBarberChanged(Barber b) {
    setState(() {
      _barber = b;
      _slot = null;
      _availableSlots = null;
      _slotsMessage = null;
    });
    if (_service != null && _date != null) _loadSlots();
  }

  Future<void> _loadSlots() async {
    final service = _service!;
    final barber = _barber!;
    final date = _date!;

    setState(() {
      _loadingSlots = true;
      _slotsMessage = null;
      _availableSlots = null;
    });

    final dowBackend = date.weekday % 7;
    final hour = widget.shopData.hours.where((h) => h.dayOfWeek == dowBackend).firstOrNull;

    if (hour == null || !hour.isOpen) {
      setState(() {
        _loadingSlots = false;
        _slotsMessage = 'La barbería está cerrada ese día. Elegí otra fecha.';
      });
      return;
    }

    try {
      final occupied = await PublicService.getAvailability(
        slug: widget.shopData.shop.slug,
        barberId: barber.id,
        date: date,
      );

      final open = _parseTime(date, hour.openTime);
      final close = _parseTime(date, hour.closeTime);
      final duration = Duration(minutes: service.durationMin);
      final now = DateTime.now();

      final slots = <DateTime>[];
      var cursor = open;
      while (!cursor.add(duration).isAfter(close)) {
        final slotEnd = cursor.add(duration);
        final overlaps = occupied.any((o) {
          final occEnd = o.start.add(Duration(minutes: o.duration));
          return cursor.isBefore(occEnd) && o.start.isBefore(slotEnd);
        });
        if (!overlaps && cursor.isAfter(now)) {
          slots.add(cursor);
        }
        cursor = cursor.add(duration);
      }

      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _availableSlots = slots;
        if (slots.isEmpty) {
          _slotsMessage = 'No quedan horarios disponibles ese día. Probá otra fecha.';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _slotsMessage = errorMessage(e);
      });
    }
  }

  DateTime _parseTime(DateTime date, String hhmm) {
    final parts = hhmm.split(':');
    return DateTime(date.year, date.month, date.day, int.parse(parts[0]), int.parse(parts[1]));
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_service == null || _barber == null || _slot == null) {
      setState(() => _error = 'Completá servicio, barbero y horario antes de continuar');
      return;
    }

    setState(() => _submitting = true);
    try {
      final appointment = await PublicService.book(
        slug: widget.shopData.shop.slug,
        barberId: _barber!.id,
        serviceId: _service!.id,
        clientName: _nameCtrl.text.trim(),
        clientPhone: _phoneCtrl.text.trim(),
        clientEmail: _emailCtrl.text.trim(),
        scheduledAt: _slot!,
        notes: _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ConfirmacionScreen(
            shopName: widget.shopData.shop.name,
            appointment: appointment,
            service: _service!,
            barber: _barber!,
          ),
        ),
      );
    } catch (e) {
      setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = widget.shopData.shop;
    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(title: Text(shop.name)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Reservá tu turno',
                    style: GoogleFonts.playfairDisplay(
                        color: AppColors.cream, fontSize: 26, fontWeight: FontWeight.w900)),
                if (shop.address != null) ...[
                  const SizedBox(height: 4),
                  Text(shop.address!,
                      style: const TextStyle(color: AppColors.creamDim, fontSize: 13)),
                ],
                const SizedBox(height: 24),

                const _StepLabel('1. ELEGÍ UN SERVICIO'),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: widget.shopData.services.map((s) {
                    final selected = _service?.id == s.id;
                    return _SelectChip(
                      label: '${s.name} · ${s.durationMin}min',
                      sublabel: _priceFormat.format(s.price),
                      selected: selected,
                      onTap: () => _onServiceChanged(s),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 22),
                const _StepLabel('2. ELEGÍ UN BARBERO'),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: widget.shopData.barbers.map((b) {
                    final selected = _barber?.id == b.id;
                    return _SelectChip(
                      label: b.name,
                      selected: selected,
                      onTap: () => _onBarberChanged(b),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 22),
                const _StepLabel('3. ELEGÍ FECHA Y HORA'),
                OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.calendar_today, size: 16),
                  label: Text(_date == null
                      ? 'Seleccionar fecha'
                      : DateFormat('EEEE d MMMM', 'es').format(_date!)),
                ),
                const SizedBox(height: 14),
                _buildSlotsSection(),

                const SizedBox(height: 22),
                const _StepLabel('4. TUS DATOS'),
                const SizedBox(height: 4),
                TextFormField(
                  controller: _nameCtrl,
                  style: const TextStyle(color: AppColors.cream),
                  decoration: const InputDecoration(hintText: 'Nombre completo'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Ingresá tu nombre' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: AppColors.cream),
                  decoration: const InputDecoration(hintText: 'Teléfono (ej. 3001234567)'),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Ingresá tu teléfono' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppColors.cream),
                  decoration: const InputDecoration(hintText: 'Email (opcional)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _notesCtrl,
                  style: const TextStyle(color: AppColors.cream),
                  decoration: const InputDecoration(hintText: 'Notas (opcional)'),
                ),

                if (_error != null) ...[
                  const SizedBox(height: 16),
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
                                style: const TextStyle(color: AppColors.danger, fontSize: 13))),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child:
                              CircularProgressIndicator(strokeWidth: 2, color: AppColors.dark))
                      : const Text('CONFIRMAR RESERVA'),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSlotsSection() {
    if (_service == null || _barber == null || _date == null) {
      return const Text('Elegí servicio, barbero y fecha para ver los horarios disponibles',
          style: TextStyle(color: AppColors.creamDim, fontSize: 12));
    }
    if (_loadingSlots) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold)),
      );
    }
    if (_slotsMessage != null) {
      return Text(_slotsMessage!, style: const TextStyle(color: AppColors.creamDim, fontSize: 12));
    }
    if (_availableSlots == null || _availableSlots!.isEmpty) {
      return const SizedBox.shrink();
    }
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _availableSlots!.map((slot) {
        final selected = _slot == slot;
        return _SelectChip(
          label: DateFormat('HH:mm').format(slot),
          selected: selected,
          onTap: () => setState(() => _slot = slot),
        );
      }).toList(),
    );
  }
}

class _StepLabel extends StatelessWidget {
  final String text;
  const _StepLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text,
          style: const TextStyle(
              color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
    );
  }
}

class _SelectChip extends StatelessWidget {
  final String label;
  final String? sublabel;
  final bool selected;
  final VoidCallback onTap;

  const _SelectChip({
    required this.label,
    this.sublabel,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.gold.withValues(alpha: 0.12) : AppColors.dark2,
          border: Border.all(color: selected ? AppColors.gold : AppColors.dark4),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: TextStyle(
                    color: selected ? AppColors.gold : AppColors.cream,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
            if (sublabel != null)
              Text(sublabel!,
                  style: const TextStyle(color: AppColors.creamDim, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
