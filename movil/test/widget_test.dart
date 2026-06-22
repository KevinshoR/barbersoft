import 'package:flutter_test/flutter_test.dart';

import 'package:movil/main.dart';

void main() {
  testWidgets('App arranca y muestra la pantalla de splash', (WidgetTester tester) async {
    await tester.pumpWidget(const BarbersoftApp());

    expect(find.text('Barbersoft'), findsOneWidget);
  });
}
