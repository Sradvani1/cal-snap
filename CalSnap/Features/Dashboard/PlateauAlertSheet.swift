import SwiftUI

struct PlateauAlertSheet: View {
    let onDietBreak: () -> Void
    let onSmallReduction: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Text("Your weight has been stable for about three weeks. This can happen during a deficit.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    Button(action: onDietBreak) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Diet Break")
                                .font(.headline)
                            Text("Eat at maintenance for 2 weeks to reset adaptation")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)

                    Button(action: onSmallReduction) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Small Reduction")
                                .font(.headline)
                            Text("Reduce daily target by 60 kcal")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)

                    Button("Remind Me Later", action: onDismiss)
                        .frame(maxWidth: .infinity)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("Plateau Detected")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationSizing(.form)
        .presentationDetents([.medium])
        .interactiveDismissDisabled()
    }
}

#Preview {
    PlateauAlertSheet(
        onDietBreak: {},
        onSmallReduction: {},
        onDismiss: {}
    )
}
