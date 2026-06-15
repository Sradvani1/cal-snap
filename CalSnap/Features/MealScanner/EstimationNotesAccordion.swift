import SwiftUI

struct EstimationNotesAccordion: View {
    let notes: String

    var body: some View {
        if !notes.isEmpty {
            DisclosureGroup("Estimation notes") {
                Text(notes)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

#Preview {
    EstimationNotesAccordion(notes: "Portion sizes estimated from plate context.")
        .padding()
}
