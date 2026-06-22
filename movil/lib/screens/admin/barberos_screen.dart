import 'package:flutter/material.dart';
import '../../models/barber.dart';
import '../../services/barber_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';

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
        content: Text('Se eliminará a "${b.name}". Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar', style: TextStyle(color: AppColors.creamDim))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Sí, eliminar', style: TextStyle(color: AppColors.danger))),
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
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
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
              child: Text('No se pudo conectar con el servidor',
                  style: TextStyle(color: AppColors.creamDim))),
          const SizedBox(height: 12),
          Center(child: TextButton(onPressed: _load, child: const Text('Reintentar'))),
        ],
      );
    }
    if (_barbers == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    if (_barbers!.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 100),
          Center(
            child: Text('Todavía no agregaste barberos',
                style: TextStyle(color: AppColors.creamDim, fontSize: 14)),
          ),
        ],
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      itemCount: _barbers!.length,
      itemBuilder: (ctx, i) {
        final b = _barbers![i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.dark2,
            border: Border.all(color: AppColors.dark4),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.dark3,
                backgroundImage:
                    (b.photoUrl != null && b.photoUrl!.isNotEmpty)
                        ? NetworkImage(b.photoUrl!)
                        : null,
                child: (b.photoUrl == null || b.photoUrl!.isEmpty)
                    ? const Icon(Icons.person, color: AppColors.creamDim)
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(b.name,
                        style: const TextStyle(
                            color: AppColors.cream, fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () => _toggleActive(b),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: b.active
                              ? AppColors.success.withValues(alpha: 0.12)
                              : AppColors.dark4.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                        child: Text(
                          b.active ? 'ACTIVO' : 'INACTIVO',
                          style: TextStyle(
                            color: b.active ? AppColors.success : AppColors.creamDim,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: AppColors.creamDim, size: 20),
                onPressed: () => _openForm(editing: b),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 20),
                onPressed: () => _delete(b),
              ),
            ],
          ),
        );
      },
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
  late final _nameCtrl = TextEditingController(text: widget.editing?.name ?? '');
  late final _photoCtrl = TextEditingController(text: widget.editing?.photoUrl ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _photoCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      if (widget.editing == null) {
        await BarberService.create(
          name: _nameCtrl.text.trim(),
          photoUrl: _photoCtrl.text.trim(),
        );
      } else {
        await BarberService.update(
          widget.editing!.id,
          name: _nameCtrl.text.trim(),
          photoUrl: _photoCtrl.text.trim(),
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
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
                    letterSpacing: 1),
              ),
              const SizedBox(height: 18),
              const _FieldLabel('NOMBRE'),
              TextFormField(
                controller: _nameCtrl,
                style: const TextStyle(color: AppColors.cream),
                decoration: const InputDecoration(hintText: 'Juan Pérez'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Ingresá el nombre' : null,
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
                Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
              ],
              const SizedBox(height: 22),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.dark))
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
      child: Text(text,
          style: const TextStyle(
              color: AppColors.creamDim,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5)),
    );
  }
}
