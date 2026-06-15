import SwiftUI

struct MealTypeSelector: View {
    @Binding var selection: MealType

    private var suggested: MealType {
        MealType.suggested(for: Date.now)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("mealScanner.mealType.label")
                .font(.subheadline.weight(.semibold))

            Text(String(format: String(localized: "mealScanner.mealType.suggested"), suggested.displayName))
                .font(.caption)
                .foregroundStyle(.secondary)

            Picker("mealScanner.mealType.label", selection: $selection) {
                ForEach(MealType.allCases, id: \.self) { type in
                    Label(type.displayName, systemImage: type.systemImage)
                        .tag(type)
                }
            }
            .pickerStyle(.segmented)
        }
    }
}

#Preview {
    MealTypeSelector(selection: .constant(.lunch))
        .padding()
}
