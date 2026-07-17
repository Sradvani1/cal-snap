import SwiftUI

struct AnalyticsTimeframePicker: View {
    @Binding var preset: AnalyticsTimeframePreset
    @Binding var selectedRange: AnalyticsDateRange
    @Binding var showCustomRangeSheet: Bool

    var body: some View {
        Picker("analytics.timeframe.picker", selection: $preset) {
            ForEach(AnalyticsTimeframePreset.allCases) { option in
                Text(presetLabel(option)).tag(option)
            }
        }
        .pickerStyle(.segmented)
    }

    private func presetLabel(_ preset: AnalyticsTimeframePreset) -> String {
        switch preset {
        case .days7: String(localized: "model.analytics.timeframe.7d")
        case .days30: String(localized: "model.analytics.timeframe.30d")
        case .days90: String(localized: "model.analytics.timeframe.90d")
        case .custom: String(localized: "model.analytics.timeframe.custom")
        }
    }
}

struct AnalyticsCustomRangeSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var customStart: Date
    @Binding var customEnd: Date
    let onApply: (Date, Date) -> Void

    var body: some View {
        NavigationStack {
            Form {
                DatePicker("analytics.timeframe.start", selection: $customStart, in: ...Date.now, displayedComponents: .date)
                DatePicker("analytics.timeframe.end", selection: $customEnd, in: ...Date.now, displayedComponents: .date)
            }
            .navigationTitle("analytics.timeframe.customTitle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.button.cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.button.apply") {
                        let start = min(customStart, customEnd)
                        let end = max(customStart, customEnd)
                        onApply(start, end)
                        dismiss()
                    }
                }
            }
        }
        .presentationSizing(.form)
    }
}

#Preview {
    AnalyticsTimeframePicker(
        preset: .constant(.days7),
        selectedRange: .constant(.days(7)),
        showCustomRangeSheet: .constant(false)
    )
    .padding()
}
