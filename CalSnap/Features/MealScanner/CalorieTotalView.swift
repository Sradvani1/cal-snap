import SwiftUI

struct CalorieTotalView: View {
    let calories: Int

    var body: some View {
        VStack(spacing: 4) {
            Text("\(calories)")
                .font(.largeTitle.bold().scaled(by: 2.0))
            Text("calories")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(calories) calories")
    }
}

#Preview {
    CalorieTotalView(calories: 382)
}
