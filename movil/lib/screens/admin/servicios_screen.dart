import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/service.dart';
import '../../services/service_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';

final _priceFormat = NumberFormat.currency(
  locale: 'es_CO',
  symbol: '\$',
  decimalDigits: 0,
);

class ServiciosScreen extends StatefulWidget {
  const ServiciosScreen({super.key});

  @override
  State<ServiciosScreen> createState() => _ServiciosScreenState();
}

class _ServiciosScreenState extends State<ServiciosScreen> {
  List<Service>? _services;
  bool _loadError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = false);
    try {
      final list = await ServiceService.getAll();
      if (!mounted) return;
      setState(() => _services = list);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadError = true);
    }
  }

  Future<void> _openForm({Service? editing}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) => _ServiceFormSheet(editing: editing),
    );
    if (saved == true) _load();
  }

  Future<void> _toggleActive(Service s) async {
    try {
      await ServiceService.update(s.id, active: !s.active);
      await _load();
    } catch (e) {
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  Future<void> _delete(Service s) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Eliminar este servicio?'),
        content: Text(
          'Se eliminará "${s.name}". Esta acción no se puede deshacer.',
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
      await ServiceService.remove(s.id);
      await _load();
      if (!mounted) return;
      showSuccessSnack(context, 'Servicio eliminado');
    } catch (e) {
      // El backend valida que no se pueda eliminar un servicio con citas
      // activas; el mensaje ya viene listo para mostrar.
      if (!mounted) return;
      showErrorSnack(context, errorMessage(e));
    }
  }

  void _showDetail(Service s) {
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
                'DETALLE DEL SERVICIO',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 16),
              Center(child: _ServiceThumb(service: s, size: 100)),
              const SizedBox(height: 14),
              Center(
                child: Text(
                  s.name,
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.cream,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _DetailRow(
                      label: 'Precio',
                      value: _priceFormat.format(s.price),
                    ),
                  ),
                  Expanded(
                    child: _DetailRow(
                      label: 'Duración',
                      value: '${s.durationMin} min',
                    ),
                  ),
                ],
              ),
              if (s.description != null && s.description!.isNotEmpty) ...[
                const Text(
                  'DESCRIPCIÓN',
                  style: TextStyle(
                    color: AppColors.creamDim,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  s.description!,
                  style: const TextStyle(color: AppColors.cream, fontSize: 14),
                ),
              ],
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
      appBar: AppBar(title: const Text('Servicios')),
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
    if (_services == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      );
    }
    if (_services!.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 100),
          Center(
            child: Text(
              'Todavía no agregaste servicios',
              style: TextStyle(color: AppColors.creamDim, fontSize: 14),
            ),
          ),
        ],
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
      itemCount: _services!.length,
      itemBuilder: (ctx, i) {
        final s = _services![i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Slidable(
            key: ValueKey(s.id),
            startActionPane: ActionPane(
              motion: const ScrollMotion(),
              extentRatio: 0.5,
              children: [
                SlidableAction(
                  onPressed: (_) => _showDetail(s),
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.dark,
                  icon: Icons.visibility_outlined,
                  label: 'Ver',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                SlidableAction(
                  onPressed: (_) => _openForm(editing: s),
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
                  onPressed: (_) => _toggleActive(s),
                  backgroundColor: AppColors.goldDim,
                  foregroundColor: AppColors.cream,
                  icon: s.active
                      ? Icons.toggle_off_outlined
                      : Icons.toggle_on_outlined,
                  label: s.active ? 'Desactivar' : 'Activar',
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                SlidableAction(
                  onPressed: (_) => _delete(s),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ServiceThumb(service: s),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                s.name,
                                style: const TextStyle(
                                  color: AppColors.cream,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () => _toggleActive(s),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: s.active
                                      ? AppColors.success.withValues(
                                          alpha: 0.12,
                                        )
                                      : AppColors.dark4.withValues(alpha: 0.4),
                                  borderRadius: BorderRadius.circular(
                                    AppRadius.pill,
                                  ),
                                ),
                                child: Text(
                                  s.active ? 'ACTIVO' : 'INACTIVO',
                                  style: TextStyle(
                                    color: s.active
                                        ? AppColors.success
                                        : AppColors.creamDim,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              '${s.durationMin} min',
                              style: const TextStyle(
                                color: AppColors.creamDim,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _priceFormat.format(s.price),
                              style: GoogleFonts.playfairDisplay(
                                color: AppColors.gold,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        if (s.description != null &&
                            s.description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            s.description!,
                            style: const TextStyle(
                              color: AppColors.creamDim,
                              fontSize: 12,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
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

/// Miniatura del servicio: imagen si hay image_url, o un ícono placeholder.
class _ServiceThumb extends StatelessWidget {
  final Service service;
  final double size;
  const _ServiceThumb({required this.service, this.size = 52});

  @override
  Widget build(BuildContext context) {
    final hasImage = service.imageUrl != null && service.imageUrl!.isNotEmpty;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Container(
        width: size,
        height: size,
        color: AppColors.dark3,
        child: hasImage
            ? Image.network(
                service.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Icon(
                  Icons.cut,
                  color: AppColors.goldLight,
                  size: size * 0.4,
                ),
              )
            : Icon(Icons.cut, color: AppColors.goldLight, size: size * 0.4),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppColors.creamDim,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.playfairDisplay(
              color: AppColors.gold,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceFormSheet extends StatefulWidget {
  final Service? editing;
  const _ServiceFormSheet({this.editing});

  @override
  State<_ServiceFormSheet> createState() => _ServiceFormSheetState();
}

class _ServiceFormSheetState extends State<_ServiceFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameCtrl = TextEditingController(
    text: widget.editing?.name ?? '',
  );
  late final _durationCtrl = TextEditingController(
    text: widget.editing?.durationMin.toString() ?? '',
  );
  late final _priceCtrl = TextEditingController(
    text: widget.editing?.price.toString() ?? '',
  );
  late final _descriptionCtrl = TextEditingController(
    text: widget.editing?.description ?? '',
  );
  late final _imageUrlCtrl = TextEditingController(
    text: widget.editing?.imageUrl ?? '',
  );
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _durationCtrl.dispose();
    _priceCtrl.dispose();
    _descriptionCtrl.dispose();
    _imageUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      final duration = int.parse(_durationCtrl.text.trim());
      final price = num.parse(_priceCtrl.text.trim());
      if (widget.editing == null) {
        await ServiceService.create(
          name: _nameCtrl.text.trim(),
          durationMin: duration,
          price: price,
          description: _descriptionCtrl.text.trim(),
          imageUrl: _imageUrlCtrl.text.trim(),
        );
      } else {
        await ServiceService.update(
          widget.editing!.id,
          name: _nameCtrl.text.trim(),
          durationMin: duration,
          price: price,
          description: _descriptionCtrl.text.trim(),
          imageUrl: _imageUrlCtrl.text.trim(),
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
                isEditing ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO',
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
                decoration: const InputDecoration(hintText: 'Corte Clásico'),
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Ingresá el nombre'
                    : null,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('DURACIÓN (MIN)'),
                        TextFormField(
                          controller: _durationCtrl,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: AppColors.cream),
                          decoration: const InputDecoration(hintText: '30'),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Obligatorio';
                            }
                            if (int.tryParse(v.trim()) == null) {
                              return 'Número inválido';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('PRECIO'),
                        TextFormField(
                          controller: _priceCtrl,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: AppColors.cream),
                          decoration: const InputDecoration(hintText: '25000'),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Obligatorio';
                            }
                            if (num.tryParse(v.trim()) == null) {
                              return 'Número inválido';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const _FieldLabel('DESCRIPCIÓN (OPCIONAL)'),
              TextFormField(
                controller: _descriptionCtrl,
                maxLines: 3,
                style: const TextStyle(color: AppColors.cream),
                decoration: const InputDecoration(
                  hintText: 'Breve descripción del servicio...',
                ),
              ),
              const SizedBox(height: 14),
              const _FieldLabel('URL DE IMAGEN (OPCIONAL)'),
              // TODO: subida de imagen desde galería/cámara. Por ahora solo se
              // acepta un link ya subido en otro lado (mismo enfoque que la web
              // antes de tener el picker de archivos).
              TextFormField(
                controller: _imageUrlCtrl,
                keyboardType: TextInputType.url,
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
                    : Text(isEditing ? 'GUARDAR CAMBIOS' : 'CREAR SERVICIO'),
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
