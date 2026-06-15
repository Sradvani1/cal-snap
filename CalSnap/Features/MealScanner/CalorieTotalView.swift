import SwiftUI

struct CalorieTotalView: View {
    let calories: Int

    var body: some View {
        VStack(spacing: 4) {
            Text("\(calories)")
                .font(.csLargeCalorie)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text("mealScanner.calories.label")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(String(format: String(localized: "mealScanner.calories.accessibility"), calories))
    }
}
