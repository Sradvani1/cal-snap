import UserNotifications
import XCTest
@testable import CalSnap

@MainActor
final class NotificationDailyLogTests: XCTestCase {
    private var mockCenter: MockNotificationCenter!
    private var manager: NotificationManager!

    override func setUp() async throws {
        try await super.setUp()
        mockCenter = MockNotificationCenter()
        manager = NotificationManager(center: mockCenter)
    }

    func testDailyLogReminderSchedulesWhenEnabled() async {
        let userId = UUID()
        manager.setDailyLogReminderEnabled(true, userId: userId)
        manager.setDailyLogReminderSchedule(userId: userId, hour: 19, minute: 30)

        await manager.scheduleDailyLogReminder(userId: userId, displayName: "Alex")

        let identifier = manager.dailyLogNotificationIdentifier(for: userId)
        let request = mockCenter.lastAddedRequest(withIdentifier: identifier)
        XCTAssertNotNil(request)
        XCTAssertEqual(request?.content.categoryIdentifier, AppConstants.Notifications.dailyLogCategoryIdentifier)
        let trigger = request?.trigger as? UNCalendarNotificationTrigger
        XCTAssertEqual(trigger?.dateComponents.hour, 19)
        XCTAssertEqual(trigger?.dateComponents.minute, 30)
        XCTAssertTrue(trigger?.repeats == true)
    }

    func testDailyLogReminderCancelledWhenDisabled() async {
        let userId = UUID()
        manager.setDailyLogReminderEnabled(false, userId: userId)

        await manager.scheduleDailyLogReminder(userId: userId, displayName: "")

        XCTAssertTrue(mockCenter.addedRequests.isEmpty)
        XCTAssertTrue(
            mockCenter.removedIdentifiers.contains(manager.dailyLogNotificationIdentifier(for: userId))
        )
    }

    func testDailyLogTapSetsPendingScannerWhenNoHandler() {
        manager.handleDailyLogReminderTap()
        XCTAssertTrue(manager.consumePendingScannerOpen())
        XCTAssertFalse(manager.consumePendingScannerOpen())
    }
}
