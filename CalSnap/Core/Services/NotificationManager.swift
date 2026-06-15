import Foundation
import UserNotifications

private let weighInNotificationUserIdKey = "userId"

@MainActor
@Observable
final class NotificationManager: NSObject {
    var onWeighInReminderTapped: ((UUID?) -> Void)?
    private(set) var pendingWeighInSheet = false
    private(set) var pendingWeighInUserId: UUID?

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

    func setReminderSchedule(userId: UUID, weekday: Int, hour: Int, minute: Int) {
        UserDefaults.standard.set(weekday, forKey: AppStorageKey.weighInReminderWeekday(userId: userId))
        UserDefaults.standard.set(hour, forKey: AppStorageKey.weighInReminderHour(userId: userId))
        UserDefaults.standard.set(minute, forKey: AppStorageKey.weighInReminderMinute(userId: userId))
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

    func snoozeFireDate(for userId: UUID, calendar: Calendar = .current) -> Date {
        let tomorrowStart = calendar.date(
            byAdding: .day,
            value: 1,
            to: calendar.startOfDay(for: Date.now)
        ) ?? Date.now
        var components = calendar.dateComponents([.year, .month, .day], from: tomorrowStart)
        components.hour = reminderHour(for: userId)
        components.minute = reminderMinute(for: userId)
        return calendar.date(from: components) ?? tomorrowStart
    }

    func snoozeUntilTomorrow(userId: UUID) async {
        let calendar = Calendar.current
        let fireDate = snoozeFireDate(for: userId, calendar: calendar)
        UserDefaults.standard.set(
            fireDate.timeIntervalSince1970,
            forKey: AppStorageKey.weighInSnoozeUntil(userId: userId)
        )

        guard await requestPermissionIfNeeded() else { return }

        center.removePendingNotificationRequests(
            withIdentifiers: ["\(notificationIdentifier(for: userId))-snooze"]
        )

        let content = UNMutableNotificationContent()
        content.title = "Weekly Weigh-In"
        content.body = "Reminder: log your weight when you're ready."
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.weighInCategoryIdentifier
        content.userInfo = [weighInNotificationUserIdKey: userId.uuidString]

        let components = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: fireDate
        )

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
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
        return Date(timeIntervalSince1970: interval) > Date.now
    }

    /// Returns the notified user id when a pending sheet was consumed, or `nil` when nothing was pending.
    /// When pending had no associated user id, returns an empty optional wrapper via `Optional.some(nil)` —
    /// use `consumePendingWeighInRequest()` for unambiguous consumption.
    func consumePendingWeighInSheet() -> UUID? {
        guard let request = consumePendingWeighInRequest() else { return nil }
        return request.userId
    }

    func consumePendingWeighInRequest() -> PendingWeighInRequest? {
        guard pendingWeighInSheet else { return nil }
        pendingWeighInSheet = false
        let userId = pendingWeighInUserId
        pendingWeighInUserId = nil
        return PendingWeighInRequest(userId: userId)
    }

    func handleWeighInReminderTap(userId: UUID?, isSnoozeRequest: Bool) {
        if !isSnoozeRequest, let userId, isWeighInSnoozed(userId: userId) {
            return
        }

        if let onWeighInReminderTapped {
            onWeighInReminderTapped(userId)
        } else {
            pendingWeighInSheet = true
            pendingWeighInUserId = userId
        }
    }

    private func notificationIdentifier(for userId: UUID) -> String {
        "weigh-in-\(userId.uuidString)"
    }
}

struct PendingWeighInRequest {
    let userId: UUID?
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
