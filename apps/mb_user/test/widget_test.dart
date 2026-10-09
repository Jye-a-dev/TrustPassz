import 'package:flutter_test/flutter_test.dart';
import 'package:mb_user/main.dart';

void main() {
  testWidgets('TrustPasszApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const TrustPasszApp());
    expect(find.byType(TrustPasszApp), findsOneWidget);
  });
}
