import Foundation
import UserNotifications

@MainActor
protocol NotificationCenterScheduling: AnyObject {
    var delegate: UNUserNotificationCenterDelegate? { get set }

    func notificationSettings() async -> UNNotificationSettings
    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool
    func add(_ request: UNNotificationRequest) async throws
    func removePendingNotificationRequests(withIdentifiers identifiers: [String])
}

@MainActor
final class LiveNotificationCenter: NotificationCenterScheduling {
    private let center: UNUserNotificationCenter

    init(center: UNUserNotificationCenter = .current()) {
        self.center = center
    }

    var delegate: UNUserNotificationCenterDelegate? {
        get { center.delegate }
        set { center.delegate = newValue }
    }

    func notificationSettings() async -> UNNotificationSettings {
        await center.notificationSettings()
    }

    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool {
        try await center.requestAuthorization(options: options)
    }

    func add(_ request: UNNotificationRequest) async throws {
        try await center.add(request)
    }

    func removePendingNotificationRequests(withIdentifiers identifiers: [String]) {
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
    }
}
