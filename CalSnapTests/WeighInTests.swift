import SwiftData
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
            date: Date(),
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
        let referenceDate = Date()
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

    func testPlateauTriggeredOnSave() throws {
        let profile = makeProfile()
        context.insert(profile)

        let calendar = Calendar.current
        let today = Date()
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
        viewModel.loadToday(context: context, activeUserId: profile.id.uuidString)

        XCTAssertEqual(viewModel.plateauWeighIns.count, 3)
        XCTAssertTrue(NutritionCalculator.isOnPlateau(weighIns: viewModel.plateauWeighIns))
        XCTAssertTrue(viewModel.showPlateauAlert)
    }

    func testPendingWeighInSheetConsumedOnce() {
        let manager = NotificationManager()
        manager.handleWeighInReminderTap(userId: nil, isSnoozeRequest: false)
        XCTAssertTrue(manager.consumePendingWeighInSheet())
        XCTAssertFalse(manager.consumePendingWeighInSheet())
    }

    func testSnoozeBlocksWeeklyReminderTapOnly() {
        let manager = NotificationManager()
        let userId = UUID()
        let snoozeKey = AppStorageKey.weighInSnoozeUntil(userId: userId)
        UserDefaults.standard.set(
            Date().addingTimeInterval(86_400).timeIntervalSince1970,
            forKey: snoozeKey
        )
        defer { UserDefaults.standard.removeObject(forKey: snoozeKey) }

        var tapCount = 0
        manager.onWeighInReminderTapped = { tapCount += 1 }

        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: false)
        XCTAssertEqual(tapCount, 0)

        manager.handleWeighInReminderTap(userId: userId, isSnoozeRequest: true)
        XCTAssertEqual(tapCount, 1)
    }

    private func makeProfile() -> UserProfile {
        let draft = ProfileDraft(
            name: "Alex",
            sex: .male,
            dateOfBirth: Calendar.current.date(byAdding: .year, value: -35, to: Date()) ?? Date(),
            heightCm: 178,
            weightKg: 80,
            goalWeightKg: 72,
            goalTargetDate: Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date(),
            activityLevel: .moderatelyActive,
            requestedDeficit: 350
        )
        return UserProfileRepository().makeUserProfile(from: draft)
    }
}
