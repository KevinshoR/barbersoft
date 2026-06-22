import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Paleta y tipografía calcadas de frontend/src/index.css (variables --gold, --dark, etc.)
class AppColors {
  static const gold = Color(0xFFC9A84C);
  static const goldLight = Color(0xFFE8C97A);
  static const goldDim = Color(0xFF8B6914);
  static const dark = Color(0xFF0D0D0D);
  static const dark2 = Color(0xFF161616);
  static const dark3 = Color(0xFF1F1F1F);
  static const dark4 = Color(0xFF2A2A2A);
  static const cream = Color(0xFFF5F0E8);
  static const creamDim = Color(0xFFB8B0A0);
  static const success = Color(0xFF4CAF7D);
  static const danger = Color(0xFFE05252);
  static const confirmed = Color(0xFF5B8DEF);

  static const statusColor = {
    'pending': goldLight,
    'confirmed': confirmed,
    'cancelled': danger,
    'done': success,
  };

  static const statusBg = {
    'pending': Color(0x1FE8C97A),
    'confirmed': Color(0x1F5B8DEF),
    'cancelled': Color(0x1FE05252),
    'done': Color(0x1F4CAF7D),
  };

  static const statusLabel = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'cancelled': 'Cancelada',
    'done': 'Completada',
  };
}

class AppRadius {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const pill = 20.0;
}

class AppTheme {
  static ThemeData get theme {
    final base = ThemeData.dark(useMaterial3: true);
    final bodyFont = GoogleFonts.dmSansTextTheme(base.textTheme);
    final headingStyle = GoogleFonts.playfairDisplay(
      color: AppColors.cream,
      fontWeight: FontWeight.w900,
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.gold,
        onPrimary: AppColors.dark,
        secondary: AppColors.goldLight,
        onSecondary: AppColors.dark,
        surface: AppColors.dark2,
        onSurface: AppColors.cream,
        error: AppColors.danger,
        onError: AppColors.dark,
      ),
      textTheme: bodyFont.copyWith(
        displayLarge: headingStyle.copyWith(fontSize: 42, letterSpacing: -0.5),
        displayMedium: headingStyle.copyWith(fontSize: 32, letterSpacing: -0.3),
        headlineLarge: headingStyle.copyWith(fontSize: 26),
        headlineMedium: headingStyle.copyWith(fontSize: 20),
        headlineSmall: headingStyle.copyWith(fontSize: 18),
        titleLarge: headingStyle.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
        bodyLarge: GoogleFonts.dmSans(color: AppColors.cream, fontSize: 15),
        bodyMedium: GoogleFonts.dmSans(color: AppColors.cream, fontSize: 14),
        bodySmall: GoogleFonts.dmSans(color: AppColors.creamDim, fontSize: 12),
        labelLarge: GoogleFonts.dmSans(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.dark2,
        foregroundColor: AppColors.cream,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.playfairDisplay(
          color: AppColors.cream,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: const IconThemeData(color: AppColors.cream),
      ),
      cardTheme: CardThemeData(
        color: AppColors.dark2,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: AppColors.dark4),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.dark4, thickness: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.dark3,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.dmSans(color: AppColors.creamDim.withValues(alpha: 0.5)),
        labelStyle: GoogleFonts.dmSans(color: AppColors.creamDim, fontSize: 13),
        floatingLabelStyle: GoogleFonts.dmSans(color: AppColors.gold, fontSize: 13),
        errorStyle: GoogleFonts.dmSans(color: AppColors.danger, fontSize: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.dark4),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.dark4),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) return AppColors.goldDim;
            if (states.contains(WidgetState.pressed) ||
                states.contains(WidgetState.hovered)) {
              return AppColors.goldLight;
            }
            return AppColors.gold;
          }),
          foregroundColor: const WidgetStatePropertyAll(AppColors.dark),
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: 22, vertical: 16),
          ),
          shape: WidgetStatePropertyAll(RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.sm),
          )),
          textStyle: WidgetStatePropertyAll(GoogleFonts.dmSans(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          )),
          elevation: const WidgetStatePropertyAll(0),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed) ||
                states.contains(WidgetState.hovered)) {
              return AppColors.gold;
            }
            return AppColors.creamDim;
          }),
          side: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed) ||
                states.contains(WidgetState.hovered)) {
              return const BorderSide(color: AppColors.gold);
            }
            return const BorderSide(color: AppColors.dark4);
          }),
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: 22, vertical: 16),
          ),
          shape: WidgetStatePropertyAll(RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.sm),
          )),
          textStyle: WidgetStatePropertyAll(GoogleFonts.dmSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
          )),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          foregroundColor: const WidgetStatePropertyAll(AppColors.gold),
          textStyle: WidgetStatePropertyAll(GoogleFonts.dmSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          )),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.dark2,
        selectedItemColor: AppColors.gold,
        unselectedItemColor: AppColors.creamDim,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.dark3,
        contentTextStyle: GoogleFonts.dmSans(color: AppColors.cream, fontSize: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          side: const BorderSide(color: AppColors.dark4),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.gold),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.dark2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(color: AppColors.dark4),
        ),
      ),
    );
  }
}

/// Card de borde sutil 1px en dark4, fondo dark2, radio 12 — igual que las cards de la web.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 20),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.dark2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.dark4),
      ),
      child: child,
    );
  }
}

/// Badge de estado de cita (pending/confirmed/cancelled/done), igual a la web.
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.statusColor[status] ?? AppColors.creamDim;
    final bg = AppColors.statusBg[status] ?? const Color(0x1FB8B0A0);
    final label = AppColors.statusLabel[status] ?? status;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}
