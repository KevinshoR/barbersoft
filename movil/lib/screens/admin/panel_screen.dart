import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/admin_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/error_helper.dart';

/// Panel de SUPER ADMIN: lista todas las barberías registradas y permite
/// agregar días de suscripción o bloquearlas. Acciones por swipe (estilo WhatsApp).
class PanelScreen extends StatefulWidget {
  const PanelScreen({super.key});

  @override
  State<PanelScreen> createState() => _PanelScreenState();
}

class _PanelScreenState extends State<PanelScreen> {
  List<AdminShop> _shops = [];
  bool _loading = true;
  String _search = '';
  String _filter = 'all'; // all | active | inactive

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final shops = await AdminService.listBarbershops();
      if (!mounted) return;
      setState(() {
        _shops = shops;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _showError(errorMessage(e));
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
    );
  }

  void _showOk(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.goldDim),
    );
  }

  List<AdminShop> get _filtered {
    final q = _search.trim().toLowerCase();
    return _shops.where((s) {
      final matchSearch = q.isEmpty ||
          s.name.toLowerCase().contains(q) ||
          s.email.toLowerCase().contains(q);
      final matchFilter = _filter == 'all' ||
          (_filter == 'active' ? s.isActiveNow : !s.isActiveNow);
      return matchSearch && matchFilter;
    }).toList();
  }

  Future<void> _extend(AdminShop shop) async {
    final days = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _ExtendSheet(shopName: shop.name),
    );
    if (days == null || days <= 0) return;
    try {
      await AdminService.extend(id: shop.id, days: days);
      _showOk('+$days días agregados a ${shop.name}');
      _load();
    } catch (e) {
      _showError(errorMessage(e));
    }
  }

  Future<void> _block(AdminShop shop) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.dark2,
        title: Text('Bloquear barbería',
            style: GoogleFonts.playfairDisplay(color: AppColors.cream)),
        content: Text(
          '¿Bloquear a "${shop.name}"? Perderá acceso al panel hasta que le agregues días.',
          style: const TextStyle(color: AppColors.creamDim),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar',
                style: TextStyle(color: AppColors.creamDim)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Bloquear',
                style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await AdminService.block(id: shop.id);
      _showOk('${shop.name} fue bloqueada');
      _load();
    } catch (e) {
      _showError(errorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _shops.where((s) => s.isActiveNow).length;
    final inactive = _shops.length - active;

    return Scaffold(
      backgroundColor: AppColors.dark,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: AppColors.gold,
          backgroundColor: AppColors.dark2,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
            children: [
              Row(
                children: [
                  const Icon(Icons.workspace_premium,
                      color: AppColors.gold, size: 18),
                  const SizedBox(width: 6),
                  Text('PANEL DE CONTROL',
                      style: GoogleFonts.dmSans(
                        color: AppColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      )),
                ],
              ),
              const SizedBox(height: 6),
              Text('Barberías registradas',
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.cream,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                  )),
              const SizedBox(height: 18),

              // Tarjetas de resumen
              Row(
                children: [
                  _StatCard(label: 'TOTAL', value: '${_shops.length}', color: AppColors.cream),
                  const SizedBox(width: 12),
                  _StatCard(label: 'ACTIVAS', value: '$active', color: AppColors.gold),
                  const SizedBox(width: 12),
                  _StatCard(label: 'INACTIVAS', value: '$inactive', color: AppColors.creamDim),
                ],
              ),
              const SizedBox(height: 18),

              // Búsqueda
              TextField(
                onChanged: (v) => setState(() => _search = v),
                style: const TextStyle(color: AppColors.cream, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Buscar por nombre o correo...',
                  hintStyle: const TextStyle(color: AppColors.creamDim),
                  prefixIcon:
                      const Icon(Icons.search, color: AppColors.creamDim, size: 20),
                  filled: true,
                  fillColor: AppColors.dark2,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    borderSide: const BorderSide(color: AppColors.dark4),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    borderSide: const BorderSide(color: AppColors.dark4),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              const SizedBox(height: 12),

              // Filtro segmentado
              Row(
                children: [
                  _FilterChip(
                      label: 'Todas',
                      selected: _filter == 'all',
                      onTap: () => setState(() => _filter = 'all')),
                  const SizedBox(width: 8),
                  _FilterChip(
                      label: 'Activas',
                      selected: _filter == 'active',
                      onTap: () => setState(() => _filter = 'active')),
                  const SizedBox(width: 8),
                  _FilterChip(
                      label: 'Inactivas',
                      selected: _filter == 'inactive',
                      onTap: () => setState(() => _filter = 'inactive')),
                ],
              ),
              const SizedBox(height: 16),

              if (_loading)
                const Padding(
                  padding: EdgeInsets.only(top: 60),
                  child: Center(
                      child: CircularProgressIndicator(color: AppColors.gold)),
                )
              else if (_filtered.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 50),
                  child: Center(
                    child: Text('No hay barberías que coincidan.',
                        style: const TextStyle(color: AppColors.creamDim)),
                  ),
                )
              else
                ..._filtered.map(_buildCard),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCard(AdminShop s) {
    final vence = s.subscriptionStatus == 'trial' ? s.trialEndsAt : s.subscriptionEndsAt;
    final venceStr = _fmtDate(vence);

    final card = Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.dark2,
        border: Border.all(color: AppColors.dark4),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(s.name,
                          style: const TextStyle(
                            color: AppColors.cream,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    if (s.isSuperAdmin) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.workspace_premium,
                          color: AppColors.gold, size: 15),
                    ],
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: s.isActiveNow
                            ? AppColors.gold.withValues(alpha: 0.15)
                            : AppColors.dark4,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        s.isActiveNow ? 'ACTIVA' : 'INACTIVA',
                        style: TextStyle(
                          color: s.isActiveNow
                              ? AppColors.gold
                              : AppColors.creamDim,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(s.email,
                    style: const TextStyle(
                        color: AppColors.creamDim, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text('Vence: ',
                        style: const TextStyle(
                            color: AppColors.creamDim, fontSize: 11)),
                    Text(venceStr,
                        style: const TextStyle(
                            color: AppColors.cream,
                            fontSize: 11,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    // El super admin no tiene acciones (no se puede modificar a sí mismo).
    if (s.isSuperAdmin) return card;

    return Slidable(
      key: ValueKey(s.id),
      startActionPane: ActionPane(
        motion: const ScrollMotion(),
        extentRatio: 0.3,
        children: [
          SlidableAction(
            onPressed: (_) => _extend(s),
            backgroundColor: AppColors.gold,
            foregroundColor: AppColors.dark,
            icon: Icons.add,
            label: 'Días',
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        ],
      ),
      endActionPane: ActionPane(
        motion: const ScrollMotion(),
        extentRatio: 0.3,
        children: [
          SlidableAction(
            onPressed: (_) => _block(s),
            backgroundColor: AppColors.danger,
            foregroundColor: AppColors.cream,
            icon: Icons.block,
            label: 'Bloquear',
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        ],
      ),
      child: card,
    );
  }

  String _fmtDate(String? iso) {
    if (iso == null) return '—';
    try {
      return DateFormat('d MMM yyyy', 'es').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return '—';
    }
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.dark2,
          border: Border.all(color: AppColors.dark4),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(
                    color: AppColors.creamDim,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5)),
            const SizedBox(height: 6),
            Text(value,
                style: TextStyle(
                    color: color,
                    fontSize: 24,
                    fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.gold : AppColors.dark2,
          border: Border.all(
              color: selected ? AppColors.gold : AppColors.dark4),
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Text(label,
            style: TextStyle(
              color: selected ? AppColors.dark : AppColors.creamDim,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            )),
      ),
    );
  }
}

/// Hoja inferior para agregar días, con atajos rápidos.
class _ExtendSheet extends StatefulWidget {
  final String shopName;
  const _ExtendSheet({required this.shopName});

  @override
  State<_ExtendSheet> createState() => _ExtendSheetState();
}

class _ExtendSheetState extends State<_ExtendSheet> {
  final _ctrl = TextEditingController(text: '30');

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: AppColors.dark2,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('AGREGAR DÍAS',
                style: GoogleFonts.dmSans(
                    color: AppColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(widget.shopName,
                style: GoogleFonts.playfairDisplay(
                    color: AppColors.cream,
                    fontSize: 20,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 18),
            TextField(
              controller: _ctrl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: AppColors.cream, fontSize: 16),
              decoration: InputDecoration(
                labelText: 'Días a agregar',
                labelStyle: const TextStyle(color: AppColors.creamDim),
                filled: true,
                fillColor: AppColors.dark3,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  borderSide: const BorderSide(color: AppColors.dark4),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  borderSide: const BorderSide(color: AppColors.dark4),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [15, 30, 90, 365].map((n) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: GestureDetector(
                      onTap: () => setState(() => _ctrl.text = '$n'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.dark3,
                          border: Border.all(color: AppColors.dark4),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Text('$n',
                            style: const TextStyle(
                                color: AppColors.creamDim,
                                fontSize: 12,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            Text(
              'Si aún tiene tiempo vigente, los días se suman a lo que le queda.',
              style: const TextStyle(color: AppColors.creamDim, fontSize: 12),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.dark4),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Cancelar',
                        style: TextStyle(color: AppColors.creamDim)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      final n = int.tryParse(_ctrl.text.trim());
                      Navigator.pop(context, n);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.dark,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Confirmar',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
