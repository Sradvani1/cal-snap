import SwiftUI

struct CalorieRingCard: View {
    let consumed: Int
    let target: Int
    let remaining: Int
    let progress: Double
    let progressBand: CalorieProgressBand

    var body: some View {
        CalorieRingView(
            consumed: consumed,
            target: target,
            remaining: remaining,
            progress: progress,
            progressBand: progressBand
        )
        .sectionCard()
    }
}

#Preview("Under target") {
    CalorieRingCard(
        consumed: 1200,
        target: 2000,
        remaining: 800,
        progress: 0.6,
        progressBand: .under
    )
    .padding()
}
