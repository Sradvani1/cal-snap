import SwiftUI
import WidgetKit

@main
struct CalSnapWidgetBundle: WidgetBundle {
    var body: some Widget {
        SmallCalorieWidget()
        MediumMacroWidget()
    }
}
