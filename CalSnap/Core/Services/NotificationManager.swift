import Foundation
import UserNotifications

private let weighInNotificationUserIdKey = "userId"

@MainActor
@Observable
final class NotificationManager: NSObject {
    var onWeighInReminderTapped: (() -> Void)?
    private(set) var pendingWeighInSheet = false

    private let center = UNUserNotificationCenter.current()

    override init() {
        super.init()
        center.delegate = self
    }

    func requestPermissionIfNeeded() async -> Bool {
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return true
        case .denied:
            return false
        case .notDetermined:
            return (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        @unknown default:
            return false
        }
    }

    func reminderWeekday(for userId: UUID) -> Int {
        let key = AppStorageKey.weighInReminderWeekday(userId: userId)
        let stored = UserDefaults.standard.integer(forKey: key)
        return stored > 0 ? stored : AppConstants.Notifications.defaultReminderWeekday
    }

    func reminderHour(for userId: UUID) -> Int {
        let key = AppStorageKey.weighInReminderHour(userId: userId)
        let stored = UserDefaults.standard.object(forKey: key) as? Int
        return stored ?? AppConstants.Notifications.defaultReminderHour
    }

    func reminderMinute(for userId: UUID) -> Int {
        let key = AppStorageKey.weighInReminderMinute(userId: userId)
        let stored = UserDefaults.standard.object(forKey: key) as? Int
        return stored ?? AppConstants.Notifications.defaultReminderMinute
    }

    func scheduleWeighInReminder(userId: UUID, name: String) async {
        guard await requestPermissionIfNeeded() else { return }

        cancelWeighInReminder(userId: userId)

        let content = UNMutableNotificationContent()
        content.title = "Weekly Weigh-In"
        content.body = "Time for your weekly weigh-in, \(name). Tap to log."
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.weighInCategoryIdentifier
        content.userInfo = [weighInNotificationUserIdKey: userId.uuidString]

        var components = DateComponents()
        components.weekday = reminderWeekday(for: userId)
        components.hour = reminderHour(for: userId)
        components.minute = reminderMinute(for: userId)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: notificationIdentifier(for: userId),
            content: content,
            trigger: trigger
        )

        try? await center.add(request)
    }

    func cancelWeighInReminder(userId: UUID) {
        center.removePendingNotificationRequests(withIdentifiers: [notificationIdentifier(for: userId)])
    }

    func snoozeUntilTomorrow(userId: UUID) async {
        let calendar = Calendar.current
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: Date())) ?? Date()
        UserDefaults.standard.set(tomorrow.timeIntervalSince1970, forKey: AppStorageKey.weighInSnoozeUntil(userId: userId))

        guard await requestPermissionIfNeeded() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Weekly Weigh-In"
        content.body = "Reminder: log your weight when you're ready."
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.weighInCategoryIdentifier
        content.userInfo = [weighInNotificationUserIdKey: userId.uuidString]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 24 * 60 * 60, repeats: false)
        let request = UNNotificationRequest(
            identifier: "\(notificationIdentifier(for: userId))-snooze",
            content: content,
            trigger: trigger
        )
        try? await center.add(request)
    }

    func isWeighInSnoozed(userId: UUID) -> Bool {
        let interval = UserDefaults.standard.double(forKey: AppStorageKey.weighInSnoozeUntil(userId: userId))
        guard interval > 0 else { return false }
        return Date(timeIntervalSince1970: interval) > Date()
    }

    func consumePendingWeighInSheet() -> Bool {
        guard pendingWeighInSheet else { return false }
        pendingWeighInSheet = false
        return true
    }

    func handleWeighInReminderTap(userId: UUID?, isSnoozeRequest: Bool) {
        if !isSnoozeRequest, let userId, isWeighInSnoozed(userId: userId) {
            return
        }

        if let onWeighInReminderTapped {
            onWeighInReminderTapped()
        } else {
            pendingWeighInSheet = true
        }
    }

    private func notificationIdentifier(for userId: UUID) -> String {
        "weigh-in-\(userId.uuidString)"
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        guard response.notification.request.content.categoryIdentifier
            == AppConstants.Notifications.weighInCategoryIdentifier else {
            return
        }

        let userInfo = response.notification.request.content.userInfo
        let userId = (userInfo[weighInNotificationUserIdKey] as? String).flatMap(UUID.init(uuidString:))
        let isSnoozeRequest = response.notification.request.identifier.hasSuffix("-snooze")

        await MainActor.run {
            handleWeighInReminderTap(userId: userId, isSnoozeRequest: isSnoozeRequest)
        }
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }
}
