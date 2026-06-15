import SwiftUI

struct AnalyticsTimeframePicker: View {
    @Binding var preset: AnalyticsTimeframePreset
    @Binding var selectedRange: AnalyticsDateRange
    @Binding var showCustomRangeSheet: Bool

    var body: some View {
        Picker("Timeframe", selection: $preset) {
            ForEach(AnalyticsTimeframePreset.allCases) { option in
                Text(option.rawValue).tag(option)
            }
        }
        .pickerStyle(.segmented)
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
                DatePicker("Start", selection: $customStart, in: ...Date.now, displayedComponents: .date)
                DatePicker("End", selection: $customEnd, in: ...Date.now, displayedComponents: .date)
            }
            .navigationTitle("Custom Range")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
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
