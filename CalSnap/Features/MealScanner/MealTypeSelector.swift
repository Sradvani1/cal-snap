import SwiftUI

struct MealTypeSelector: View {
    @Binding var selection: MealType

    private var suggested: MealType {
        MealType.suggested(for: Date())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Meal type")
                .font(.subheadline.weight(.semibold))

            Text("Suggested: \(suggested.displayName)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Picker("Meal type", selection: $selection) {
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
