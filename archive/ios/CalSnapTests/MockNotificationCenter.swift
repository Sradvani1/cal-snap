import Foundation
@preconcurrency import UserNotifications
@testable import CalSnap

@MainActor
final class MockNotificationCenter: NotificationCenterScheduling {
    var delegate: UNUserNotificationCenterDelegate?

    private(set) var addedRequests: [UNNotificationRequest] = []
    private(set) var removedIdentifiers: [String] = []
    var authorizationGranted = true

    func notificationSettings() async -> UNNotificationSettings {
        await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                continuation.resume(returning: settings)
            }
        }
    }

    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool {
        authorizationGranted
    }

    func add(_ request: UNNotificationRequest) async throws {
        addedRequests.append(request)
    }

    func removePendingNotificationRequests(withIdentifiers identifiers: [String]) {
        removedIdentifiers.append(contentsOf: identifiers)
    }

    func lastAddedRequest(withIdentifier identifier: String) -> UNNotificationRequest? {
        addedRequests.last { $0.identifier == identifier }
    }
}
