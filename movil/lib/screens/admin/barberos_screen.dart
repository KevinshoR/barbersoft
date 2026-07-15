import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/barber.dart';
import '../../services/barber_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';

const _weekDays = [
  (label: 'Lun', value: 1),
  (label: 'Mar', value: 2),
  (label: 'Mié', value: 3),
  (label: 'Jue', value: 4),
  (label: 'Vie', value: 5),
  (label: 'Sáb', value: 6),
  (label: 'Dom', value: 0),
];

const _defaultWorkDays = [1, 2, 3, 4, 5, 6];

List<int> _parseWorkDays(String? s) {
  if (s == null || s.isEmpty) return [];
  return s
      .split(',')
      .map((e) => int.tryParse(e.trim()))
      .whereType<int>()
      .toList();
}

class BarberosScreen extends StatefulWidget {
  const BarberosScreen({super.key});

  @override
  State<BarberosScreen> createState() => _BarberosScreenState();
}

class _BarberosScreenState extends State<BarberosScreen> {
  List<Barber>? _barbers;
  bool _loadError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = false);
    try {
      final list = await BarberService.getAll();
      if (!mounted) return;
      setState(() => _barbers = list);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadError = true);
    }
  }

  Future<void> _openForm({Barber? editing}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) => _BarberFormSheet(editing: editing),
    );
    if (saved == true) _load();
  }

  Future<void> _toggleActive(Barber b) async {
    try {
      await BarberService.update(b.id, active: !b.active);
      await _load();
    } catch (e) {
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  Future<void> _delete(Barber b) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Eliminar este barbero?'),
        content: Text(
          'Se eliminará a "${b.name}". Esta acción no se puede deshacer.',
        ),
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
      await BarberService.remove(b.id);
      await _load();
      if (!mounted) return;
      showSuccessSnack(context, 'Barbero eliminado');
    } catch (e) {
      // El backend valida que no se pueda eliminar un barbero con citas
      // asociadas; el mensaje ya viene listo para mostrar.
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  void _showDetail(Barber b) {
    final days = _parseWorkDays(b.workDays);
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
                'DETALLE DEL BARBERO',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 16),
              Center(child: _BarberAvatar(barber: b, radius: 44)),
              const SizedBox(height: 14),
              Center(
                child: Text(
                  b.name,
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.cream,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Center(child: _ActiveBadge(active: b.active)),
              const SizedBox(height: 20),
              _DetailRow(
                label: 'Especialidad',
                value: (b.specialty != null && b.specialty!.isNotEmpty)
                    ? b.specialty!
                    : 'Sin especificar',
              ),
              const SizedBox(height: 4),
              const Text(
                'DÍAS QUE TRABAJA',
                style: TextStyle(
                  color: AppColors.creamDim,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              if (days.isEmpty)
                const Text(
                  'Sin días definidos',
                  style: TextStyle(color: AppColors.creamDim, fontSize: 13),
                )
              else
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _weekDays
                      .where((d) => days.contains(d.value))
                      .map((d) => _DayChip(label: d.label))
                      .toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      appBar: AppBar(title: const Text('Barberos')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.dark,
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
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
    if (_barbers == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      );
    }
    if (_barbers!.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 100),
          Center(
            child: Text(
              'Todavía no agregaste barberos',
              style: TextStyle(color: AppColors.creamDim, fontSize: 14),
            ),
          ),
        ],
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      itemCount: _barbers!.length,
      itemBuilder: (ctx, i) {
        final b = _barbers![i];
        final days = _parseWorkDays(b.workDays);
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Slidable(
            key: ValueKey(b.id),
            startActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: 0.5,
              children: [
                SlidableAction(
                  onPressed: (_) => _showDetail(b),
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.dark,
                  icon: Icons.visibility_outlined,
                  label: 'Ver',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                SlidableAction(
                  onPressed: (_) => _openForm(editing: b),
                  backgroundColor: AppColors.goldDim,
                  foregroundColor: AppColors.cream,
                  icon: Icons.edit_outlined,
                  label: 'Editar',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ],
            ),
            endActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: 0.5,
              children: [
                SlidableAction(
                  onPressed: (_) => _toggleActive(b),
                  backgroundColor: AppColors.goldDim,
                  foregroundColor: AppColors.cream,
                  icon: b.active
                      ? Icons.toggle_off_outlined
                      : Icons.toggle_on_outlined,
                  label: b.active ? 'Desactivar' : 'Activar',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                SlidableAction(
                  onPressed: (_) => _delete(b),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _BarberAvatar(barber: b),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              b.name,
                              style: const TextStyle(
                                color: AppColors.cream,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                            if (b.specialty != null &&
                                b.specialty!.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                b.specialty!,
                                style: const TextStyle(
                                  color: AppColors.creamDim,
                                  fontSize: 12,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => _toggleActive(b),
                        child: _ActiveBadge(active: b.active),
                      ),
                    ],
                  ),
                  if (days.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _weekDays
                          .where((d) => days.contains(d.value))
                          .map((d) => _DayChip(label: d.label))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Avatar circular con foto, o inicial del nombre sobre fondo dorado si no hay foto.
class _BarberAvatar extends StatelessWidget {
  final Barber barber;
  final double radius;
  const _BarberAvatar({required this.barber, this.radius = 26});

  @override
  Widget build(BuildContext context) {
    final hasPhoto = barber.photoUrl != null && barber.photoUrl!.isNotEmpty;
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.dark3,
      backgroundImage: hasPhoto ? NetworkImage(barber.photoUrl!) : null,
      child: hasPhoto
          ? null
          : Text(
              barber.name.isNotEmpty ? barber.name[0].toUpperCase() : '?',
              style: GoogleFonts.playfairDisplay(
                color: AppColors.goldLight,
                fontWeight: FontWeight.w800,
                fontSize: radius * 0.75,
              ),
            ),
    );
  }
}

/// Chip pequeño dorado para un día que el barbero trabaja.
class _DayChip extends StatelessWidget {
  final String label;
  const _DayChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.goldLight,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Pill ACTIVO/INACTIVO — mismo switch de siempre, ahora también accesible por swipe.
class _ActiveBadge extends StatelessWidget {
  final bool active;
  const _ActiveBadge({required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: active
            ? AppColors.success.withValues(alpha: 0.12)
            : AppColors.dark4.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        active ? 'ACTIVO' : 'INACTIVO',
        style: TextStyle(
          color: active ? AppColors.success : AppColors.creamDim,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
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
            width: 100,
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

class _BarberFormSheet extends StatefulWidget {
  final Barber? editing;
  const _BarberFormSheet({this.editing});

  @override
  State<_BarberFormSheet> createState() => _BarberFormSheetState();
}

class _BarberFormSheetState extends State<_BarberFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameCtrl = TextEditingController(
    text: widget.editing?.name ?? '',
  );
  late final _photoCtrl = TextEditingController(
    text: widget.editing?.photoUrl ?? '',
  );
  late final _specialtyCtrl = TextEditingController(
    text: widget.editing?.specialty ?? '',
  );
  late final List<int> _workDays =
      (widget.editing?.workDays != null && widget.editing!.workDays!.isNotEmpty)
      ? _parseWorkDays(widget.editing!.workDays)
      : List.of(_defaultWorkDays);
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _photoCtrl.dispose();
    _specialtyCtrl.dispose();
    super.dispose();
  }

  void _toggleDay(int value) {
    setState(() {
      if (_workDays.contains(value)) {
        _workDays.remove(value);
      } else {
        _workDays.add(value);
      }
    });
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    final workDaysStr = (_workDays.toList()..sort()).join(',');
    try {
      if (widget.editing == null) {
        await BarberService.create(
          name: _nameCtrl.text.trim(),
          photoUrl: _photoCtrl.text.trim(),
          specialty: _specialtyCtrl.text.trim(),
          workDays: workDaysStr,
        );
      } else {
        await BarberService.update(
          widget.editing!.id,
          name: _nameCtrl.text.trim(),
          photoUrl: _photoCtrl.text.trim(),
          specialty: _specialtyCtrl.text.trim(),
          workDays: workDaysStr,
        );
      }
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
    final isEditing = widget.editing != null;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
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
              Text(
                isEditing ? 'EDITAR BARBERO' : 'NUEVO BARBERO',
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 18),
              const _FieldLabel('NOMBRE'),
              TextFormField(
                controller: _nameCtrl,
                style: const TextStyle(color: AppColors.cream),
                decoration: const InputDecoration(hintText: 'Juan Pérez'),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Ingresá el nombre'
                    : null,
              ),
              const SizedBox(height: 14),
              const _FieldLabel('ESPECIALIDAD (OPCIONAL)'),
              TextFormField(
                controller: _specialtyCtrl,
                maxLength: 120,
                style: const TextStyle(color: AppColors.cream),
                decoration: const InputDecoration(
                  hintText: 'Ej: Cortes clásicos y degradados',
                ),
              ),
              const SizedBox(height: 6),
              const _FieldLabel('DÍAS QUE TRABAJA'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _weekDays.map((d) {
                  final selected = _workDays.contains(d.value);
                  return GestureDetector(
                    onTap: () => _toggleDay(d.value),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.gold : AppColors.dark3,
                        border: Border.all(
                          color: selected ? AppColors.gold : AppColors.dark4,
                        ),
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: Text(
                        d.label,
                        style: TextStyle(
                          color: selected ? AppColors.dark : AppColors.creamDim,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              const _FieldLabel('URL DE FOTO (OPCIONAL)'),
              TextFormField(
                controller: _photoCtrl,
                style: const TextStyle(color: AppColors.cream),
                decoration: const InputDecoration(hintText: 'https://...'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.danger, fontSize: 13),
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
                    : Text(isEditing ? 'GUARDAR CAMBIOS' : 'CREAR BARBERO'),
              ),
            ],
          ),
        ),
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
