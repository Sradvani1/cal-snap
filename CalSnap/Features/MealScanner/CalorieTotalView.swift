import SwiftUI

struct CalorieTotalView: View {
    let calories: Int

    var body: some View {
        VStack(spacing: 4) {
            Text("\(calories)")
                .font(.csLargeCalorie)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text("calories")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(calories) calories")
    }
}
