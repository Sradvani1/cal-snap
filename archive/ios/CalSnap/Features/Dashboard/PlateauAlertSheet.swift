import SwiftUI

struct PlateauAlertSheet: View {
    let onDietBreak: () -> Void
    let onSmallReduction: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Text("dashboard.plateau.message")
                    .font(.body)
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    Button(action: onDietBreak) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("dashboard.plateau.dietBreak.title")
                                .font(.headline)
                            Text("dashboard.plateau.dietBreak.subtitle")
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
                            Text("dashboard.plateau.smallReduction.title")
                                .font(.headline)
                            Text("dashboard.plateau.smallReduction.subtitle")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)

                    Button("dashboard.plateau.remindLater", action: onDismiss)
                        .frame(maxWidth: .infinity)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("dashboard.plateau.navigationTitle")
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
