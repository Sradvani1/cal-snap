import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class DashboardViewModelTests: XCTestCase {
    private var viewModel: DashboardViewModel!
    private var container: ModelContainer!
    private var context: ModelContext!

    override func setUp() async throws {
        try await super.setUp()
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
            configurations: config
        )
        context = container.mainContext
        viewModel = DashboardViewModel(
            userProfileRepository: UserProfileRepository(),
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository()
        )
    }

    override func tearDown() async throws {
        let defaults = UserDefaults.standard
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("plateauSnoozeUntil_") || key.hasPrefix("maintenanceModeUntil_") {
            defaults.removeObject(forKey: key)
        }
        try await super.tearDown()
    }

    func testDashboardCalcToday() throws {
        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350
        )
        context.insert(profile)

        let meals = [
            MealEntry(
                userId: profile.id,
                timestamp: Date.now,
                mealType: .breakfast,
                totalCalories: 400,
                totalProteinG: 30,
                totalCarbsG: 40,
                totalFatG: 12,
                totalFiberG: 5
            ),
            MealEntry(
                userId: profile.id,
                timestamp: Date.now,
                mealType: .lunch,
                totalCalories: 600,
                totalProteinG: 35,
                totalCarbsG: 55,
                totalFatG: 20,
                totalFiberG: 8
            ),
            MealEntry(
                userId: profile.id,
                timestamp: Date.now,
                mealType: .dinner,
                totalCalories: 500,
                totalProteinG: 40,
                totalCarbsG: 45,
                totalFatG: 18,
                totalFiberG: 6
            ),
        ]
        meals.forEach { context.insert($0) }
        try context.save()

        viewModel.loadToday(context: context)

        XCTAssertEqual(viewModel.todaysCalories, 1500)
        XCTAssertEqual(viewModel.todaysProteinG, 105, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysCarbsG, 140, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysFatG, 50, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysFiberG, 19, accuracy: 0.01)
        XCTAssertEqual(viewModel.mealsByType[.breakfast]?.count, 1)
        XCTAssertEqual(viewModel.mealsByType[.lunch]?.count, 1)
        XCTAssertEqual(viewModel.mealsByType[.dinner]?.count, 1)
    }

    func testProgressColor() {
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 0.89), .under)
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 0.95), .onTrack)
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 1.15), .over)
    }

    func testRemaining() {
        viewModel.activeProfile = UserProfile(dailyCalorieTarget: 2000)
        viewModel.todaysCalories = 2300
        XCTAssertEqual(viewModel.remainingCalories, -300)
    }

    func testFiberTargetFromCalorieTarget() {
        viewModel.activeProfile = UserProfile(dailyCalorieTarget: 2000)
        XCTAssertEqual(viewModel.fiberTargetG, 28, accuracy: 0.01)
    }

    func testFiberProgressBandThresholds() {
        viewModel.activeProfile = UserProfile(dailyCalorieTarget: 2000)
        viewModel.todaysFiberG = 26.6
        XCTAssertEqual(viewModel.fiberProgressBand, .onTrack)

        viewModel.todaysFiberG = 21
        XCTAssertEqual(viewModel.fiberProgressBand, .moderate)

        viewModel.todaysFiberG = 10
        XCTAssertEqual(viewModel.fiberProgressBand, .low)
    }

    func testNetCalorieSummary() {
        viewModel.activeProfile = UserProfile(dailyCalorieTarget: 2000)
        viewModel.todaysCalories = 2300
        XCTAssertEqual(viewModel.netCalorieDelta, 300)
        XCTAssertEqual(viewModel.netCalorieSummary, "+300 over goal")
    }

    func testLoadTodayResetsPlateauAlertWhenNoProfile() {
        viewModel.showPlateauAlert = true
        viewModel.loadToday(context: context)
        XCTAssertFalse(viewModel.showPlateauAlert)
    }

    func testPlateauSnoozeSuppressesAlert() throws {
        let profile = try makeProfileWithPlateauWeighIns()
        let snoozeEnd = Calendar.current.date(byAdding: .day, value: 14, to: Date.now)!
        UserDefaults.standard.set(
            snoozeEnd.timeIntervalSince1970,
            forKey: AppStorageKey.plateauSnoozeUntil(userId: profile.id)
        )

        viewModel.loadToday(context: context)

        XCTAssertFalse(viewModel.showPlateauAlert)
    }

    func testMaintenanceModeSuppressesAlert() throws {
        let profile = try makeProfileWithPlateauWeighIns()
        let maintenanceEnd = Calendar.current.date(byAdding: .day, value: 14, to: Date.now)!
        UserDefaults.standard.set(
            maintenanceEnd.timeIntervalSince1970,
            forKey: AppStorageKey.maintenanceModeUntil(userId: profile.id)
        )

        viewModel.loadToday(context: context)

        XCTAssertFalse(viewModel.showPlateauAlert)
    }

    func testApplyDietBreakUpdatesTargetAndDismissesOnSave() throws {
        let profile = try makeProfileWithPlateauWeighIns()
        viewModel.loadToday(context: context)
        XCTAssertTrue(viewModel.showPlateauAlert)

        viewModel.applyDietBreak(context: context)

        XCTAssertEqual(profile.dailyCalorieTarget, profile.tdee)
        XCTAssertEqual(profile.deficitKcal, 0)
        XCTAssertFalse(viewModel.showPlateauAlert)
    }

    func testApplyDietBreakNoOpWithoutActiveProfile() {
        viewModel.showPlateauAlert = true
        viewModel.applyDietBreak(context: context)
        XCTAssertTrue(viewModel.showPlateauAlert)
    }

    func testApplyDietBreakKeepsAlertOnSaveFailure() throws {
        let profile = try makeProfileWithPlateauWeighIns()
        viewModel.loadToday(context: context)
        XCTAssertTrue(viewModel.showPlateauAlert)

        let originalTarget = profile.dailyCalorieTarget
        let originalDeficit = profile.deficitKcal

        viewModel.simulatePersistProfileFailure = true
        viewModel.applyDietBreak(context: context)

        XCTAssertTrue(viewModel.showPlateauAlert)
        XCTAssertEqual(profile.dailyCalorieTarget, originalTarget)
        XCTAssertEqual(profile.deficitKcal, originalDeficit)
        XCTAssertEqual(
            UserDefaults.standard.double(forKey: AppStorageKey.maintenanceModeUntil(userId: profile.id)),
            0
        )
    }

    func testApplySmallReductionRespectsMinimum() throws {
        let profile = UserProfile(
            name: "Alex",
            sex: .female,
            dailyCalorieTarget: AppConstants.Deficit.minCaloriesFemale,
            tdee: 1700,
            deficitKcal: 200
        )
        context.insert(profile)
        try context.save()

        viewModel.loadToday(context: context)
        viewModel.showPlateauAlert = true

        viewModel.applySmallReduction(context: context)

        XCTAssertEqual(profile.dailyCalorieTarget, AppConstants.Deficit.minCaloriesFemale)
        XCTAssertFalse(viewModel.showPlateauAlert)
    }

    func testDismissPlateauAlertStoresSnooze() throws {
        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350
        )
        context.insert(profile)
        try context.save()

        viewModel.loadToday(context: context)
        viewModel.showPlateauAlert = true

        viewModel.dismissPlateauAlert()

        XCTAssertFalse(viewModel.showPlateauAlert)
        let stored = UserDefaults.standard.double(forKey: AppStorageKey.plateauSnoozeUntil(userId: profile.id))
        XCTAssertGreaterThan(stored, 0)
    }

    private func makeProfileWithPlateauWeighIns() throws -> UserProfile {
        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350
        )
        context.insert(profile)

        let calendar = Calendar.current
        let today = Date.now
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: today)!
        let oneWeekAgo = calendar.date(byAdding: .day, value: -7, to: today)!

        let weighInRepository = WeighInRepository()
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: twoWeeksAgo, weightKg: 80.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: oneWeekAgo, weightKg: 80.0),
            context: context
        )
        try weighInRepository.save(
            WeighIn(userId: profile.id, date: today, weightKg: 80.0),
            context: context
        )

        return profile
    }
}
