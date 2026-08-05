import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import 'barberos_screen.dart';
import 'citas_screen.dart';
import 'dashboard_screen.dart';
import 'panel_screen.dart';
import 'servicios_screen.dart';
import 'suscripcion_screen.dart';

/// Shell del panel ADMIN con bottom navigation, equivalente a los links
/// horizontales del Navbar de la web (Inicio, Citas, Barberos, Servicios, ...).
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final isSuper =
        context.watch<AuthProvider>().barbershop?.isSuperAdmin ?? false;

    // Pantallas base + Panel de super admin al final (solo si aplica).
    final screens = <Widget>[
      const DashboardScreen(),
      const CitasScreen(),
      const BarberosScreen(),
      const ServiciosScreen(),
      const SuscripcionScreen(),
      if (isSuper) const PanelScreen(),
    ];

    final items = <BottomNavigationBarItem>[
      const BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined), label: 'Inicio'),
      const BottomNavigationBarItem(
          icon: Icon(Icons.event_note_outlined), label: 'Citas'),
      const BottomNavigationBarItem(
          icon: Icon(Icons.people_outline), label: 'Barberos'),
      const BottomNavigationBarItem(
          icon: Icon(Icons.content_cut_outlined), label: 'Servicios'),
      const BottomNavigationBarItem(
          icon: Icon(Icons.workspace_premium_outlined), label: 'Plan'),
      if (isSuper)
        const BottomNavigationBarItem(
            icon: Icon(Icons.admin_panel_settings_outlined), label: 'Panel'),
    ];

    // Si dejó de ser super admin (o cambió la sesión) y el índice quedó fuera
    // de rango, lo reajustamos para no crashear.
    final safeIndex = _index >= screens.length ? 0 : _index;

    return Scaffold(
      body: IndexedStack(index: safeIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: safeIndex,
        onTap: (i) => setState(() => _index = i),
        selectedFontSize: 11,
        unselectedFontSize: 11,
        type: BottomNavigationBarType.fixed,
        items: items,
      ),
      backgroundColor: AppColors.dark,
    );
  }
}