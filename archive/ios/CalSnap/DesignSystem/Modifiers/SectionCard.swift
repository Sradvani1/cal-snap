import SwiftUI

struct SectionCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.csSurface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

extension View {
    func sectionCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(SectionCardModifier(cornerRadius: cornerRadius))
    }
}
