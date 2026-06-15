import SwiftUI

struct MacroBarCard: View {
    let proteinConsumed: Double
    let proteinTarget: Double
    let carbsConsumed: Double
    let carbsTarget: Double
    let fatConsumed: Double
    let fatTarget: Double
    let fiberConsumed: Double
    let fiberTarget: Double
    let fiberProgressBand: FiberProgressBand

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Macros")
                .font(.headline)

            MacroBarRow(label: "Protein", consumed: proteinConsumed, target: proteinTarget, color: Color.csProtein)
            MacroBarRow(label: "Carbs", consumed: carbsConsumed, target: carbsTarget, color: Color.csCarbs)
            MacroBarRow(label: "Fat", consumed: fatConsumed, target: fatTarget, color: Color.csFat)

            Divider()

            MacroBarRow(
                label: "Fiber",
                consumed: fiberConsumed,
                target: fiberTarget,
                color: Color.fiberProgress(for: fiberProgressBand),
                barHeight: 6,
                progressBand: fiberProgressBand
            )
        }
        .sectionCard()
    }
}
