import Foundation
import UserNotifications

private let notificationUserIdKey = "userId"

@MainActor
@Observable
final class NotificationManager: NSObject {
    var onWeighInReminderTapped: ((UUID?) -> Void)?
    var onDailyLogReminderTapped: (() -> Void)?

    private(set) var pendingWeighInSheet = false
    private(set) var pendingWeighInUserId: UUID?
    private(set) var pendingScannerOpen = false

    private let center: any NotificationCenterScheduling

    init(center: NotificationCenterScheduling = LiveNotificationCenter()) {
        self.center = center
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

    // MARK: - Weigh-in reminder

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
        _ = name
        guard await requestPermissionIfNeeded() else { return }

        cancelWeighInReminder(userId: userId)

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Weekly Weigh-In")
        content.body = String(localized: "Time for your weekly weigh-in. Tap to log.")
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.weighInCategoryIdentifier
        content.userInfo = [notificationUserIdKey: userId.uuidString]

        var components = DateComponents()
        components.weekday = reminderWeekday(for: userId)
        components.hour = reminderHour(for: userId)
        components.minute = reminderMinute(for: userId)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: weighInNotificationIdentifier(for: userId),
            content: content,
            trigger: trigger
        )

        try? await center.add(request)
    }

    func cancelWeighInReminder(userId: UUID) {
        center.removePendingNotificationRequests(withIdentifiers: [weighInNotificationIdentifier(for: userId)])
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
            withIdentifiers: ["\(weighInNotificationIdentifier(for: userId))-snooze"]
        )

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Weekly Weigh-In")
        content.body = String(localized: "Reminder: log your weight when you're ready.")
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.weighInCategoryIdentifier
        content.userInfo = [notificationUserIdKey: userId.uuidString]

        let components = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: fireDate
        )

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: "\(weighInNotificationIdentifier(for: userId))-snooze",
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

    // MARK: - Daily log reminder

    func isDailyLogReminderEnabled(for userId: UUID) -> Bool {
        UserDefaults.standard.bool(forKey: AppStorageKey.dailyLogReminderEnabled(userId: userId))
    }

    func setDailyLogReminderEnabled(_ enabled: Bool, userId: UUID) {
        UserDefaults.standard.set(enabled, forKey: AppStorageKey.dailyLogReminderEnabled(userId: userId))
    }

    func dailyLogReminderHour(for userId: UUID) -> Int {
        let stored = UserDefaults.standard.object(forKey: AppStorageKey.dailyLogReminderHour(userId: userId)) as? Int
        return stored ?? AppConstants.Notifications.defaultDailyLogReminderHour
    }

    func dailyLogReminderMinute(for userId: UUID) -> Int {
        let stored = UserDefaults.standard.object(forKey: AppStorageKey.dailyLogReminderMinute(userId: userId)) as? Int
        return stored ?? AppConstants.Notifications.defaultDailyLogReminderMinute
    }

    func setDailyLogReminderSchedule(userId: UUID, hour: Int, minute: Int) {
        UserDefaults.standard.set(hour, forKey: AppStorageKey.dailyLogReminderHour(userId: userId))
        UserDefaults.standard.set(minute, forKey: AppStorageKey.dailyLogReminderMinute(userId: userId))
    }

    func scheduleDailyLogReminder(userId: UUID, displayName: String) async {
        _ = displayName
        guard isDailyLogReminderEnabled(for: userId) else {
            cancelDailyLogReminder(userId: userId)
            return
        }
        guard await requestPermissionIfNeeded() else { return }

        cancelDailyLogReminder(userId: userId)

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Log Your Meals")
        content.body = String(localized: "Don't forget to log today's meals.")
        content.sound = .default
        content.categoryIdentifier = AppConstants.Notifications.dailyLogCategoryIdentifier
        content.userInfo = [notificationUserIdKey: userId.uuidString]

        var components = DateComponents()
        components.hour = dailyLogReminderHour(for: userId)
        components.minute = dailyLogReminderMinute(for: userId)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: dailyLogNotificationIdentifier(for: userId),
            content: content,
            trigger: trigger
        )
        try? await center.add(request)
    }

    func cancelDailyLogReminder(userId: UUID) {
        center.removePendingNotificationRequests(withIdentifiers: [dailyLogNotificationIdentifier(for: userId)])
    }

    // MARK: - Pending actions

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

    func consumePendingScannerOpen() -> Bool {
        guard pendingScannerOpen else { return false }
        pendingScannerOpen = false
        return true
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

    func handleDailyLogReminderTap() {
        if let onDailyLogReminderTapped {
            onDailyLogReminderTapped()
        } else {
            pendingScannerOpen = true
        }
    }

    func weighInNotificationIdentifier(for userId: UUID) -> String {
        "weigh-in-\(userId.uuidString)"
    }

    func dailyLogNotificationIdentifier(for userId: UUID) -> String {
        "daily-log-\(userId.uuidString)"
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
        let category = response.notification.request.content.categoryIdentifier

        switch category {
        case AppConstants.Notifications.weighInCategoryIdentifier:
            let userInfo = response.notification.request.content.userInfo
            let userId = (userInfo[notificationUserIdKey] as? String).flatMap(UUID.init(uuidString:))
            let isSnoozeRequest = response.notification.request.identifier.hasSuffix("-snooze")
            await MainActor.run {
                handleWeighInReminderTap(userId: userId, isSnoozeRequest: isSnoozeRequest)
            }
        case AppConstants.Notifications.dailyLogCategoryIdentifier:
            await MainActor.run {
                handleDailyLogReminderTap()
            }
        default:
            break
        }
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }
}
