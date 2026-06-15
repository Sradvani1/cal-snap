import SwiftData
import UserNotifications
import XCTest
@testable import CalSnap

@MainActor
final class WeighInTests: XCTestCase {
    private var container: ModelContainer!
    private var context: ModelContext!
    private let weighInRepository = WeighInRepository()
    private let healthKitService = HealthKitService()

    override func setUp() async throws {
        try await super.setUp()
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
            configurations: config
        )
        context = container.mainContext
    }

    func testWeighInRecalculation() throws {
        let profile = makeProfile()
        context.insert(profile)
        try context.save()

        let preSaveTDEE = profile.tdee
        let preSaveTarget = profile.dailyCalorieTarget
        let preSaveDeficit = profile.deficitKcal

        let result = try WeighInService.save(
            profile: profile,
            newWeightKg: 78,
            date: Date.now,
            weighInRepository: weighInRepository,
            healthKitService: healthKitService,
            context: context
        )

        XCTAssertLessThan(profile.tdee, preSaveTDEE)
        XCTAssertLessThan(profile.dailyCalorieTarget, preSaveTarget)
        XCTAssertEqual(profile.deficitKcal, preSaveDeficit)
        XCTAssertEqual(result.weighIn.calculatedTDEE, profile.tdee)
        XCTAssertEqual(result.weighIn.adjustedDailyTarget, profile.dailyCalorieTarget)
        XCTAssertEqual(result.weighIn.bmi, NutritionCalculator.bmi(weightKg: 78, heightCm: 178), accuracy: 0.1)
        XCTAssertGreaterThanOrEqual(result.weighIn.bmi, 24.0)
        XCTAssertLessThanOrEqual(result.weighIn.bmi, 25.0)
    }

    func testProjectedGoalDate() {
        let referenceDate = Date.now
        let projectedDate = NutritionCalculator.projectedGoalDate(
            currentWeightKg: 80,
            goalWeightKg: 72,
            heightCm: 178,
            ageYears: 35,
            sex: .male,
            activityLevel: .moderatelyActive,
            dailyDeficitKcal: 350,
            referenceDate: referenceDate
        )

        XCTAssertNotNil(projectedDate)
        guard let projectedDate else { return }

        XCTAssertGreaterThan(projectedDate, referenceDate)

        let weeks = Calendar.current.dateComponents([.weekOfYear], from: referenceDate, to: projectedDate).weekOfYear ?? 0
        XCTAssertGreaterThanOrEqual(weeks, 14)
        XCTAssertLessThanOrEqual(weeks, 30)
    }

    func testSaveReturnsDidTriggerPlateau() throws {
        let profile = makeProfile()
        context.insert(profile)

        let calendar = Calendar.current
        let today = Date.now
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: today)!
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: today)!

        try weighInRepository.save(
            WeighIn(userId: profile.id, date: twoWeeksAgo, weightKg: 80.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: oneWeekAgo, weightKg: 80.0),
            context: context
        )

        let result = try WeighInService.save(
            profile: profile,
            newWeightKg: 80.0,
            date: today,
            weighInRepository: weighInRepository,
            healthKitService: healthKitService,
            context: context
        )

        XCTAssertTrue(result.didTriggerPlateau)
    }

    func testPlateauTriggeredOnSave() throws {
        let profile = makeProfile()
        context.insert(profile)

        let calendar = Calendar.current
        let today = Date.now
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: today)!
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: today)!

        try weighInRepository.save(
            WeighIn(userId: profile.id, date: twoWeeksAgo, weightKg: 80.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: oneWeekAgo, weightKg: 80.0),
            context: context
        )

        _ = try WeighInService.save(
            profile: profile,
            newWeightKg: 80.0,
            date: today,
            weighInRepository: weighInRepository,
            healthKitService: healthKitService,
            context: context
        )

        let viewModel = DashboardViewModel(
            userProfileRepository: UserProfileRepository(),
            mealRepository: MealRepository(),
            weighInRepository: weighInRepository
        )
        viewModel.loadToday(context: context)

        XCTAssertEqual(viewModel.plateauWeighIns.count, 3)
        XCTAssertTrue(NutritionCalculator.isOnPlateau(weighIns: viewModel.plateauWeighIns))
        XCTAssertTrue(viewModel.showPlateauAlert)
    }

    func testWeeklyPlateauFetchSpacing() throws {
        let profile = makeProfile()
        context.insert(profile)

        let calendar = Calendar.current
        let today = Date.now
        let twoDaysAgo = calendar.date(byAdding: .day, value: -2, to: today)!
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: today)!
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: today)!

        try weighInRepository.save(
            WeighIn(userId: profile.id, date: twoWeeksAgo, weightKg: 80.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: oneWeekAgo, weightKg: 79.5),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: twoDaysAgo, weightKg: 79.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: today, weightKg: 78.5),
            context: context
        )

        let plateauWeighIns = try weighInRepository.fetchWeeklyPlateauWeighIns(
            for: profile.id,
            count: 3,
            context: context
        )

        XCTAssertEqual(plateauWeighIns.count, 3)
        XCTAssertEqual(plateauWeighIns.last?.id, try XCTUnwrap(
            try weighInRepository.fetchLatestWeighIns(for: profile.id, count: 1, context: context).last?.id
        ))
        XCTAssertFalse(plateauWeighIns.contains { $0.date == twoDaysAgo })
    }

    func testSetUseLbsConvertsWeight() {
        let profile = makeProfile()
        let viewModel = WeighInViewModel(
            profile: profile,
            currentWeightKg: 80,
            useLbs: false,
            weighInRepository: weighInRepository,
            healthKitService: healthKitService
        )

        viewModel.setUseLbs(true)
        XCTAssertTrue(viewModel.useLbs)
        XCTAssertEqual(viewModel.weightKg, 80, accuracy: 0.1)

        viewModel.setUseLbs(false)
        XCTAssertFalse(viewModel.useLbs)
        XCTAssertEqual(viewModel.weightKg, 80, accuracy: 0.1)
    }

    func testWeeklyLossRateKg() {
        let userId = UUID()
        let calendar = Calendar.current
        let today = Date.now
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: today)!

        let weighIns = [
            WeighIn(userId: userId, date: oneWeekAgo, weightKg: 80.0),
            WeighIn(userId: userId, date: today, weightKg: 79.0),
        ]

        let rate = NutritionCalculator.weeklyLossRateKg(from: weighIns)
        XCTAssertNotNil(rate)
        XCTAssertEqual(rate ?? 0, 1.0, accuracy: 0.1)
    }

    func testProjectionPointsStopsAtGoal() {
        let startDate = Date.now
        let points = NutritionCalculator.projectionPoints(
            startWeightKg: 74,
            goalWeightKg: 72,
            heightCm: 178,
            ageYears: 35,
            sex: .male,
            activityLevel: .moderatelyActive,
            dailyDeficitKcal: 350,
            startDate: startDate
        )

        XCTAssertFalse(points.isEmpty)
        XCTAssertLessThanOrEqual(points.last?.weightKg ?? .infinity, 72.5)
    }

    func testPendingWeighInSheetConsumedOnce() {
        let manager = NotificationManager()
        let userId = UUID()
        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: false)
        XCTAssertEqual(manager.consumePendingWeighInSheet(), userId)
        XCTAssertNil(manager.consumePendingWeighInSheet())
    }

    func testNotificationTapPassesUserId() {
        let manager = NotificationManager()
        let userId = UUID()
        let expectation = expectation(description: "callback")
        var receivedUserId: UUID?
        manager.onWeighInReminderTapped = { id in
            receivedUserId = id
            expectation.fulfill()
        }

        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: false)
        wait(for: [expectation], timeout: 1)
        XCTAssertEqual(receivedUserId, userId)
    }

    func testSnoozeFireDateAlignsWithReminderTime() {
        let manager = NotificationManager()
        let userId = UUID()
        let calendar = Calendar.current

        let fireDate = manager.snoozeFireDate(for: userId, calendar: calendar)
        let tomorrowStart = calendar.date(
            byAdding: .day,
            value: 1,
            to: calendar.startOfDay(for: Date.now)
        )!

        XCTAssertGreaterThan(fireDate, tomorrowStart)

        let hour = calendar.component(.hour, from: fireDate)
        let minute = calendar.component(.minute, from: fireDate)
        XCTAssertEqual(hour, AppConstants.Notifications.defaultReminderHour)
        XCTAssertEqual(minute, AppConstants.Notifications.defaultReminderMinute)
    }

    func testSnoozeNotificationUsesCalendarTrigger() {
        let manager = NotificationManager()
        let userId = UUID()
        let calendar = Calendar.current
        let fireDate = manager.snoozeFireDate(for: userId, calendar: calendar)

        let components = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: fireDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        XCTAssertFalse(trigger.repeats)
        XCTAssertEqual(components.hour, AppConstants.Notifications.defaultReminderHour)
        XCTAssertEqual(components.minute, AppConstants.Notifications.defaultReminderMinute)

        let tomorrowStart = calendar.date(
            byAdding: .day,
            value: 1,
            to: calendar.startOfDay(for: Date.now)
        )!
        XCTAssertGreaterThan(fireDate, tomorrowStart)
    }

    func testSnoozeBlocksWeeklyReminderTapOnly() {
        let manager = NotificationManager()
        let userId = UUID()
        let snoozeKey = AppStorageKey.weighInSnoozeUntil(userId: userId)
        UserDefaults.standard.set(
            Date.now.addingTimeInterval(86_400).timeIntervalSince1970,
            forKey: snoozeKey
        )
        defer { UserDefaults.standard.removeObject(forKey: snoozeKey) }

        var tapCount = 0
        manager.onWeighInReminderTapped = { _ in tapCount += 1 }

        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: false)
        XCTAssertEqual(tapCount, 0)

        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: true)
        XCTAssertEqual(tapCount, 1)
    }

    private func makeProfile() -> UserProfile {
        let draft = ProfileDraft(
            name: "Alex",
            sex: .male,
            dateOfBirth: Calendar.current.date(byAdding: .year, value: -35, to: Date.now) ?? Date.now,
            heightCm: 178,
            weightKg: 80,
            goalWeightKg: 72,
            goalTargetDate: Calendar.current.date(byAdding: .month, value: 6, to: Date.now) ?? Date.now,
            activityLevel: .moderatelyActive,
            requestedDeficit: 350
        )
        return UserProfileRepository().makeUserProfile(from: draft)
    }
}
