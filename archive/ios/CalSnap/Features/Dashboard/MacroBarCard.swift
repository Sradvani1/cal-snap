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
            Text("dashboard.macros.title")
                .font(.headline)

            MacroBarRow(label: String(localized: "designSystem.macroBar.protein"), consumed: proteinConsumed, target: proteinTarget, color: Color.csProtein)
            MacroBarRow(label: String(localized: "designSystem.macroBar.carbs"), consumed: carbsConsumed, target: carbsTarget, color: Color.csCarbs)
            MacroBarRow(label: String(localized: "designSystem.macroBar.fat"), consumed: fatConsumed, target: fatTarget, color: Color.csFat)

            Divider()

            MacroBarRow(
                label: String(localized: "dashboard.macros.fiber"),
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
