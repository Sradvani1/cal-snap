import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class PrimaryProfileResolutionTests: XCTestCase {
    private var container: ModelContainer!
    private var context: ModelContext!
    private let repository = UserProfileRepository()

    override func setUp() async throws {
        try await super.setUp()
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
            configurations: config
        )
        context = container.mainContext
    }

    func testLegacyMultiProfileStoreResolvesEarliestCreatedProfile() throws {
        let olderDate = Date(timeIntervalSince1970: 1_700_000_000)
        let newerDate = Date(timeIntervalSince1970: 1_800_000_000)

        let olderProfile = UserProfile(
            name: "Older",
            dailyCalorieTarget: 2000,
            tdee: 2300,
            deficitKcal: 300,
            createdAt: olderDate,
            updatedAt: olderDate
        )
        let newerProfile = UserProfile(
            name: "Newer",
            dailyCalorieTarget: 1800,
            tdee: 2100,
            deficitKcal: 300,
            createdAt: newerDate,
            updatedAt: newerDate
        )
        context.insert(newerProfile)
        context.insert(olderProfile)
        try context.save()

        let primary = try XCTUnwrap(repository.fetchPrimaryProfile(context: context))
        XCTAssertEqual(primary.id, olderProfile.id)

        let dashboardVM = DashboardViewModel(
            userProfileRepository: repository,
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository()
        )
        dashboardVM.loadToday(context: context)
        XCTAssertEqual(dashboardVM.activeProfile?.id, olderProfile.id)
        XCTAssertTrue(dashboardVM.greeting.hasSuffix("Older"))

        let settingsVM = SettingsViewModel(
            userProfileRepository: repository,
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository(),
            healthKitService: HealthKitService(),
            geminiService: GeminiService(),
            notificationManager: NotificationManager()
        )
        settingsVM.load(context: context)
        XCTAssertEqual(settingsVM.activeProfile?.id, olderProfile.id)

        let analyticsVM = AnalyticsViewModel(
            userProfileRepository: repository,
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository()
        )
        analyticsVM.load(context: context)
        XCTAssertEqual(analyticsVM.activeProfile?.id, olderProfile.id)
    }

    func testEmptyNameGreetingIsToday() {
        let viewModel = DashboardViewModel(
            userProfileRepository: UserProfileRepository(),
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository()
        )
        viewModel.activeProfile = UserProfile(name: "", dailyCalorieTarget: 2000, tdee: 2300, deficitKcal: 300)
        XCTAssertEqual(viewModel.greeting, "Today")
    }
}
