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
        viewModel.currentStep = .welcome
        XCTAssertTrue(viewModel.canAdvance(from: .welcome))

        viewModel.currentStep = .profileSetup
        viewModel.profileDraft.name = ""
        let invalidDOB = Calendar.current.date(byAdding: .year, value: -10, to: Date.now)!
        viewModel.profileDraft.dateOfBirth = invalidDOB
        XCTAssertFalse(viewModel.canAdvance(from: .profileSetup))

        let validDOB = Calendar.current.date(byAdding: .year, value: -35, to: Date.now)!
        viewModel.profileDraft.dateOfBirth = validDOB
        XCTAssertTrue(viewModel.canAdvance(from: .profileSetup))
    }

    func testGoalDateMinimum() {
        let calendar = Calendar.current
        let tooSoon = calendar.date(byAdding: .day, value: 7, to: Date.now)!
        XCTAssertFalse(viewModel.validateGoalTargetDate(tooSoon))

        let valid = calendar.date(byAdding: .day, value: 14, to: Date.now)!
        XCTAssertTrue(viewModel.validateGoalTargetDate(valid))
    }

    func testProfilePersistence() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: UserProfile.self, configurations: config)
        let context = container.mainContext
        let repository = UserProfileRepository()

        var draft = ProfileDraft()
        draft.name = ""
        draft.weightKg = 80
        draft.heightCm = 178
        draft.goalWeightKg = 72
        draft.requestedDeficit = 350

        let profile = repository.makeUserProfile(from: draft)
        try repository.save([profile], context: context)

        let fetched = try repository.fetchAll(context: context)
        XCTAssertEqual(fetched.count, 1)
        let saved = try XCTUnwrap(fetched.first)
        XCTAssertEqual(saved.name, "")
        XCTAssertEqual(saved.startingWeightKg, 80, accuracy: 0.01)
        XCTAssertEqual(saved.macroTargetProteinPct, AppConstants.Nutrition.defaultMacroProteinPct, accuracy: 0.001)
        XCTAssertEqual(saved.macroTargetCarbsPct, AppConstants.Nutrition.defaultMacroCarbsPct, accuracy: 0.001)
        XCTAssertEqual(saved.macroTargetFatPct, AppConstants.Nutrition.defaultMacroFatPct, accuracy: 0.001)
        XCTAssertGreaterThan(saved.dailyCalorieTarget, 0)
        XCTAssertGreaterThan(saved.tdee, 0)
    }
}
