import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'barberos_screen.dart';
import 'citas_screen.dart';
import 'dashboard_screen.dart';
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

  static const _screens = [
    DashboardScreen(),
    CitasScreen(),
    BarberosScreen(),
    ServiciosScreen(),
    SuscripcionScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Inicio'),
          BottomNavigationBarItem(
              icon: Icon(Icons.event_note_outlined), label: 'Citas'),
          BottomNavigationBarItem(icon: Icon(Icons.people_outline), label: 'Barberos'),
          BottomNavigationBarItem(
              icon: Icon(Icons.content_cut_outlined), label: 'Servicios'),
          BottomNavigationBarItem(
              icon: Icon(Icons.workspace_premium_outlined), label: 'Plan'),
        ],
      ),
      backgroundColor: AppColors.dark,
    );
  }
}
