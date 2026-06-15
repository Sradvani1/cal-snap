import SwiftUI
import UIKit

struct InteractivePopGestureDisabler: UIViewControllerRepresentable {
    let isDisabled: Bool

    func makeUIViewController(context: Context) -> UIViewController {
        UIViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        DispatchQueue.main.async {
            guard let navigationController = Self.findNavigationController(from: uiViewController) else { return }
            navigationController.interactivePopGestureRecognizer?.isEnabled = !isDisabled
        }
    }

    static func dismantleUIViewController(_ uiViewController: UIViewController, coordinator: ()) {
        DispatchQueue.main.async {
            findNavigationController(from: uiViewController)?
                .interactivePopGestureRecognizer?.isEnabled = true
        }
    }

    private static func findNavigationController(from controller: UIViewController) -> UINavigationController? {
        var current: UIViewController? = controller
        while let candidate = current {
            if let navigationController = candidate as? UINavigationController {
                return navigationController
            }
            if let navigationController = candidate.navigationController {
                return navigationController
            }
            current = candidate.parent
        }
        return nil
    }
}
