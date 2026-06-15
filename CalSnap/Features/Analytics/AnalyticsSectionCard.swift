import SwiftUI

struct AnalyticsSectionCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.csCardTitle)
            content()
        }
        .sectionCard()
    }
}
