import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/appointment.dart';
import '../../models/barber.dart';
import '../../models/service.dart';
import '../../services/appointment_service.dart';
import '../../services/barber_service.dart';
import '../../services/service_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';

const _transitions = {
  'pending': ['confirmed', 'done', 'cancelled'],
  'confirmed': ['done', 'cancelled'],
  'done': <String>[],
  'cancelled': <String>[],
};

final _priceFormat = NumberFormat.currency(
  locale: 'es_CO',
  symbol: '\$',
  decimalDigits: 0,
);

class CitasScreen extends StatefulWidget {
  const CitasScreen({super.key});

  @override
  State<CitasScreen> createState() => _CitasScreenState();
}

class _CitasScreenState extends State<CitasScreen> {
  List<Appointment>? _appointments;
  bool _loadError = false;
  DateTime? _filterDate;
  String? _filterStatus;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = false);
    try {
      final list = await AppointmentService.getAll();
      if (!mounted) return;
      setState(() => _appointments = list);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadError = true);
    }
  }

  List<Appointment> get _filtered {
    final all = _appointments ?? [];
    return all.where((a) {
      final matchDate =
          _filterDate == null ||
          (a.scheduledAt.year == _filterDate!.year &&
              a.scheduledAt.month == _filterDate!.month &&
              a.scheduledAt.day == _filterDate!.day);
      final matchStatus = _filterStatus == null || a.status == _filterStatus;
      return matchDate && matchStatus;
    }).toList();
  }

  Future<void> _updateStatus(Appointment a, String status) async {
    try {
      await AppointmentService.updateStatus(a.id!, status);
      await _load();
      if (!mounted) return;
      const msgs = {
        'confirmed': 'Cita confirmada',
        'done': 'Cita completada',
        'cancelled': 'Cita cancelada',
      };
      showSuccessSnack(context, msgs[status] ?? 'Estado actualizado');
    } catch (e) {
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  Future<void> _delete(Appointment a) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Eliminar esta cita?'),
        content: const Text('Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AppColors.creamDim),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Sí, eliminar',
              style: TextStyle(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await AppointmentService.remove(a.id!);
      await _load();
      if (!mounted) return;
      showSuccessSnack(context, 'Cita eliminada');
    } catch (e) {
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  bool _canRemind(Appointment a) =>
      a.status != 'cancelled' &&
      (a.clientEmail != null && a.clientEmail!.isNotEmpty) &&
      a.scheduledAt.isAfter(DateTime.now());

  Future<void> _remind(Appointment a) async {
    try {
      await AppointmentService.remind(a.id!);
      if (!mounted) return;
      showSuccessSnack(context, 'Recordatorio enviado al cliente');
    } catch (e) {
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  void _showDetail(Appointment a) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.dark2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.dark4,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text(
                'DETALLE DE LA CITA',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      a.clientName,
                      style: GoogleFonts.playfairDisplay(
                        color: AppColors.cream,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  StatusBadge(status: a.status),
                ],
              ),
              const SizedBox(height: 18),
              _DetailRow(
                label: 'Fecha',
                value: DateFormat('d MMM yyyy', 'es').format(a.scheduledAt),
              ),
              _DetailRow(
                label: 'Hora',
                value: DateFormat('HH:mm').format(a.scheduledAt),
              ),
              _DetailRow(label: 'Barbero', value: a.barberName ?? '—'),
              _DetailRow(label: 'Servicio', value: a.serviceName ?? '—'),
              if (a.price != null)
                _DetailRow(
                  label: 'Precio',
                  value: _priceFormat.format(a.price),
                ),
              _DetailRow(label: 'Teléfono', value: a.clientPhone),
              _DetailRow(
                label: 'Email',
                value: (a.clientEmail?.isNotEmpty ?? false)
                    ? a.clientEmail!
                    : 'Sin registrar',
              ),
              if (a.notes != null && a.notes!.isNotEmpty)
                _DetailRow(label: 'Notas', value: a.notes!),
            ],
          ),
        ),
      ),
    );
  }

  void _showStatusSheet(Appointment a) {
    final options = _transitions[a.status] ?? [];
    if (options.isEmpty) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.dark2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            const Text(
              'Cambiar estado',
              style: TextStyle(
                color: AppColors.cream,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 8),
            ...options.map(
              (opt) => ListTile(
                leading: Icon(
                  Icons.circle,
                  size: 10,
                  color: AppColors.statusColor[opt] ?? AppColors.creamDim,
                ),
                title: Text(
                  AppColors.statusLabel[opt] ?? opt,
                  style: const TextStyle(color: AppColors.cream),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _updateStatus(a, opt);
                },
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _openCreateSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) => const _CreateAppointmentSheet(),
    );
    if (created == true) _load();
  }

  Future<void> _pickFilterDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _filterDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _filterDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(title: const Text('Citas')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.dark,
        onPressed: _openCreateSheet,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickFilterDate,
                    icon: const Icon(Icons.calendar_today, size: 14),
                    label: Text(
                      _filterDate == null
                          ? 'Fecha'
                          : DateFormat('d MMM', 'es').format(_filterDate!),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    value: _filterStatus,
                    isExpanded: true,
                    dropdownColor: AppColors.dark3,
                    style: const TextStyle(
                      color: AppColors.cream,
                      fontSize: 13,
                    ),
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                    ),
                    hint: const Text(
                      'Estado',
                      style: TextStyle(color: AppColors.creamDim),
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Todos')),
                      DropdownMenuItem(
                        value: 'pending',
                        child: Text('Pendiente'),
                      ),
                      DropdownMenuItem(
                        value: 'confirmed',
                        child: Text('Confirmada'),
                      ),
                      DropdownMenuItem(
                        value: 'done',
                        child: Text('Completada'),
                      ),
                      DropdownMenuItem(
                        value: 'cancelled',
                        child: Text('Cancelada'),
                      ),
                    ],
                    onChanged: (v) => setState(() => _filterStatus = v),
                  ),
                ),
                if (_filterDate != null || _filterStatus != null)
                  IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: AppColors.creamDim,
                      size: 18,
                    ),
                    onPressed: () => setState(() {
                      _filterDate = null;
                      _filterStatus = null;
                    }),
                  ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              color: AppColors.gold,
              backgroundColor: AppColors.dark2,
              child: _buildList(filtered),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(List<Appointment> filtered) {
    if (_loadError) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          const Icon(Icons.cloud_off, color: AppColors.creamDim, size: 36),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'No se pudo conectar con el servidor',
              style: TextStyle(color: AppColors.creamDim),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: _load,
              child: const Text('Reintentar'),
            ),
          ),
        ],
      );
    }
    if (_appointments == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      );
    }
    if (filtered.isEmpty) {
      return ListView(
        children: [
          const SizedBox(height: 100),
          const Center(
            child: Text(
              'Aún no tenés citas',
              style: TextStyle(color: AppColors.creamDim, fontSize: 14),
            ),
          ),
        ],
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 90),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) {
        final a = filtered[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Slidable(
            key: ValueKey(a.id),
            startActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: _canRemind(a) ? 0.5 : 0.28,
              children: [
                SlidableAction(
                  onPressed: (_) => _showDetail(a),
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.dark,
                  icon: Icons.visibility_outlined,
                  label: 'Ver',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                if (_canRemind(a))
                  SlidableAction(
                    onPressed: (_) => _remind(a),
                    backgroundColor: AppColors.goldDim,
                    foregroundColor: AppColors.cream,
                    icon: Icons.notifications_outlined,
                    label: 'Recordar',
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
              ],
            ),
            endActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: 0.5,
              children: [
                SlidableAction(
                  onPressed: (_) => _showStatusSheet(a),
                  backgroundColor: AppColors.goldDim,
                  foregroundColor: AppColors.cream,
                  icon: Icons.label_outline,
                  label: 'Estado',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                SlidableAction(
                  onPressed: (_) => _delete(a),
                  backgroundColor: AppColors.danger,
                  foregroundColor: AppColors.cream,
                  icon: Icons.delete_outline,
                  label: 'Eliminar',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ],
            ),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.dark2,
                border: Border.all(color: AppColors.dark4),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.dark3,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    constraints: const BoxConstraints(minWidth: 64),
                    child: Column(
                      children: [
                        Text(
                          DateFormat('HH:mm').format(a.scheduledAt),
                          style: GoogleFonts.playfairDisplay(
                            color: AppColors.gold,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          DateFormat('d MMM', 'es').format(a.scheduledAt),
                          style: const TextStyle(
                            color: AppColors.creamDim,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a.clientName,
                          style: const TextStyle(
                            color: AppColors.cream,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${a.serviceName ?? ''} · ${a.barberName ?? ''}',
                          style: const TextStyle(
                            color: AppColors.creamDim,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          a.clientPhone,
                          style: const TextStyle(
                            color: AppColors.creamDim,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      GestureDetector(
                        onTap: () => _showStatusSheet(a),
                        child: StatusBadge(status: a.status),
                      ),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () => _delete(a),
                        child: const Icon(
                          Icons.delete_outline,
                          color: AppColors.danger,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _CreateAppointmentSheet extends StatefulWidget {
  const _CreateAppointmentSheet();

  @override
  State<_CreateAppointmentSheet> createState() =>
      _CreateAppointmentSheetState();
}

class _CreateAppointmentSheetState extends State<_CreateAppointmentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<Barber>? _barbers;
  List<Service>? _services;
  int? _barberId;
  int? _serviceId;
  DateTime? _date;
  TimeOfDay? _time;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    try {
      final results = await Future.wait([
        BarberService.getAll(),
        ServiceService.getAll(),
      ]);
      if (!mounted) return;
      setState(() {
        _barbers = (results[0] as List<Barber>).where((b) => b.active).toList();
        _services = (results[1] as List<Service>)
            .where((s) => s.active)
            .toList();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = errorMessage(e));
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) setState(() => _time = picked);
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_barberId == null || _serviceId == null) {
      setState(() => _error = 'Seleccioná barbero y servicio');
      return;
    }
    if (_date == null || _time == null) {
      setState(() => _error = 'Seleccioná fecha y hora');
      return;
    }
    final scheduledAt = DateTime(
      _date!.year,
      _date!.month,
      _date!.day,
      _time!.hour,
      _time!.minute,
    );
    final minDate = DateTime.now().add(const Duration(minutes: 30));
    final maxDate = DateTime.now().add(const Duration(days: 30));
    if (scheduledAt.isBefore(minDate)) {
      setState(
        () => _error = 'La cita debe ser al menos 30 minutos desde ahora',
      );
      return;
    }
    if (scheduledAt.isAfter(maxDate)) {
      setState(
        () => _error = 'La cita no puede ser a más de 1 mes de distancia',
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await AppointmentService.create(
        barberId: _barberId!,
        serviceId: _serviceId!,
        clientName: _nameCtrl.text.trim(),
        clientPhone: _phoneCtrl.text.trim(),
        clientEmail: _emailCtrl.text.trim(),
        scheduledAt: scheduledAt,
        notes: _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedService = _services
        ?.where((s) => s.id == _serviceId)
        .cast<Service?>()
        .firstOrNull;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) {
          return SingleChildScrollView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.dark4,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'NUEVA CITA',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (_barbers == null || _services == null)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: CircularProgressIndicator(color: AppColors.gold),
                      ),
                    )
                  else ...[
                    const _FieldLabel('BARBERO'),
                    DropdownButtonFormField<int>(
                      value: _barberId,
                      dropdownColor: AppColors.dark3,
                      style: const TextStyle(
                        color: AppColors.cream,
                        fontSize: 14,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Seleccioná un barbero',
                      ),
                      items: _barbers!
                          .map(
                            (b) => DropdownMenuItem(
                              value: b.id,
                              child: Text(b.name),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => _barberId = v),
                      validator: (v) =>
                          v == null ? 'Seleccioná un barbero' : null,
                    ),
                    const SizedBox(height: 14),
                    const _FieldLabel('SERVICIO'),
                    DropdownButtonFormField<int>(
                      value: _serviceId,
                      dropdownColor: AppColors.dark3,
                      style: const TextStyle(
                        color: AppColors.cream,
                        fontSize: 14,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Seleccioná un servicio',
                      ),
                      items: _services!
                          .map(
                            (s) => DropdownMenuItem(
                              value: s.id,
                              child: Text('${s.name} — ${s.durationMin}min'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => _serviceId = v),
                      validator: (v) =>
                          v == null ? 'Seleccioná un servicio' : null,
                    ),
                    if (selectedService != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.08),
                          border: Border.all(
                            color: AppColors.gold.withValues(alpha: 0.2),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${selectedService.name} · ${selectedService.durationMin} min',
                              style: const TextStyle(
                                color: AppColors.creamDim,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              _priceFormat.format(selectedService.price),
                              style: GoogleFonts.playfairDisplay(
                                color: AppColors.gold,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    const _FieldLabel('NOMBRE DEL CLIENTE'),
                    TextFormField(
                      controller: _nameCtrl,
                      style: const TextStyle(color: AppColors.cream),
                      decoration: const InputDecoration(hintText: 'Juan Pérez'),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Ingresá el nombre'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    const _FieldLabel('TELÉFONO'),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: AppColors.cream),
                      decoration: const InputDecoration(hintText: '3001234567'),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Ingresá el teléfono'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    const _FieldLabel('EMAIL (OPCIONAL)'),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: AppColors.cream),
                      decoration: const InputDecoration(
                        hintText: 'cliente@email.com',
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _FieldLabel('FECHA'),
                              OutlinedButton(
                                onPressed: _pickDate,
                                child: Text(
                                  _date == null
                                      ? 'Elegir'
                                      : DateFormat(
                                          'd MMM yyyy',
                                          'es',
                                        ).format(_date!),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _FieldLabel('HORA'),
                              OutlinedButton(
                                onPressed: _pickTime,
                                child: Text(
                                  _time == null
                                      ? 'Elegir'
                                      : _time!.format(context),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const _FieldLabel('NOTAS (OPCIONAL)'),
                    TextFormField(
                      controller: _notesCtrl,
                      style: const TextStyle(color: AppColors.cream),
                      decoration: const InputDecoration(
                        hintText: 'Indicaciones especiales...',
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: AppColors.danger,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 22),
                    ElevatedButton(
                      onPressed: _saving ? null : _submit,
                      child: _saving
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.dark,
                              ),
                            )
                          : const Text('CREAR CITA'),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label.toUpperCase(),
              style: const TextStyle(
                color: AppColors.creamDim,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppColors.cream, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, top: 2),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.creamDim,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
