import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class OnboardingViewModelTests: XCTestCase {
    private var viewModel: OnboardingViewModel!

    override func setUp() {
        super.setUp()
        viewModel = OnboardingViewModel(
            healthKitService: HealthKitService(),
            geminiService: GeminiService(),
            userProfileRepository: UserProfileRepository()
        )
    }

    func testOnboardingValidation() {
        viewModel.currentStep = .profileSetup
        viewModel.profileA.name = ""
        XCTAssertFalse(viewModel.canAdvance(from: .profileSetup))

        viewModel.profileA.name = "Alex"
        XCTAssertTrue(viewModel.canAdvance(from: .profileSetup))
    }

    func testGoalDateMinimum() {
        let calendar = Calendar.current
        let tooSoon = calendar.date(byAdding: .day, value: 7, to: Date())!
        XCTAssertFalse(viewModel.validateGoalTargetDate(tooSoon))

        let valid = calendar.date(byAdding: .day, value: 14, to: Date())!
        XCTAssertTrue(viewModel.validateGoalTargetDate(valid))
    }

    func testProfilePersistence() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: UserProfile.self, configurations: config)
        let context = container.mainContext
        let repository = UserProfileRepository()

        var draft = ProfileDraft()
        draft.name = "Alex"
        draft.weightKg = 80
        draft.heightCm = 178
        draft.goalWeightKg = 72
        draft.requestedDeficit = 350

        let profile = repository.makeUserProfile(from: draft)
        try repository.save([profile], context: context)

        let fetched = try repository.fetchAll(context: context)
        XCTAssertEqual(fetched.count, 1)
        XCTAssertEqual(fetched.first?.name, "Alex")
        XCTAssertEqual(fetched.first?.startingWeightKg, 80, accuracy: 0.01)
        XCTAssertEqual(fetched.first?.macroTargetProteinPct, 0.28, accuracy: 0.001)
        XCTAssertEqual(fetched.first?.macroTargetCarbsPct, 0.47, accuracy: 0.001)
        XCTAssertEqual(fetched.first?.macroTargetFatPct, 0.25, accuracy: 0.001)
        XCTAssertGreaterThan(fetched.first?.dailyCalorieTarget ?? 0, 0)
        XCTAssertGreaterThan(fetched.first?.tdee ?? 0, 0)
    }
}
