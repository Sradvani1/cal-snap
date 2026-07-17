import SwiftData
import XCTest
@testable import CalSnap

final class SettingsTests: XCTestCase {
    func testMacroSliderValidation() {
        let adjusted = ProfileUpdateService.adjustMacroPercents(
            changed: .protein,
            newValue: 40,
            protein: 28,
            carbs: 47,
            fat: 25
        )
        XCTAssertEqual(adjusted.0 + adjusted.1 + adjusted.2, 100)
        XCTAssertTrue(adjusted.0 >= 0 && adjusted.1 >= 0 && adjusted.2 >= 0)

        XCTAssertFalse(ProfileUpdateService.macroPercentsAreValid(protein: 30, carbs: 30, fat: 30))
        let normalized = ProfileUpdateService.normalizedMacroPercents(protein: 33, carbs: 33, fat: 33)
        XCTAssertEqual(normalized.0 + normalized.1 + normalized.2, 100)
        XCTAssertTrue(ProfileUpdateService.macroPercentsAreValid(
            protein: normalized.0,
            carbs: normalized.1,
            fat: normalized.2
        ))
    }

    func testRecalculationOnProfileEdit() throws {
        let profile = UserProfile(
            name: "Alex",
            sex: .male,
            heightCm: 175,
            startingWeightKg: 80,
            activityLevel: .moderatelyActive,
            dailyCalorieTarget: 0,
            tdee: 0,
            deficitKcal: 350
        )

        let baseline = ProfileUpdateService.preview(
            sex: profile.sex,
            dateOfBirth: profile.dateOfBirth,
            heightCm: profile.heightCm,
            weightKg: 80,
            activityLevel: profile.activityLevel,
            deficitKcal: profile.deficitKcal
        )

        let taller = ProfileUpdateService.preview(
            sex: profile.sex,
            dateOfBirth: profile.dateOfBirth,
            heightCm: 180,
            weightKg: 80,
            activityLevel: profile.activityLevel,
            deficitKcal: profile.deficitKcal
        )
        XCTAssertGreaterThan(taller.tdee, baseline.tdee)
        XCTAssertGreaterThan(taller.dailyTarget, baseline.dailyTarget)

        let lighter = ProfileUpdateService.preview(
            sex: profile.sex,
            dateOfBirth: profile.dateOfBirth,
            heightCm: 175,
            weightKg: 75,
            activityLevel: profile.activityLevel,
            deficitKcal: profile.deficitKcal
        )
        XCTAssertLessThan(lighter.tdee, baseline.tdee)
        XCTAssertLessThan(lighter.dailyTarget, baseline.dailyTarget)
        XCTAssertEqual(lighter.deficitKcal, baseline.deficitKcal)
    }

    func testCSVExport() {
        let userId = UUID()
        let mealId = UUID()
        let weighInId = UUID()
        let timestamp = Date(timeIntervalSince1970: 1_700_000_000)

        let meal = MealEntry(
            id: mealId,
            userId: userId,
            timestamp: timestamp,
            mealType: .lunch,
            textDescription: "Chicken, rice",
            totalCalories: 500,
            totalProteinG: 40,
            totalCarbsG: 50,
            totalFatG: 12,
            totalFiberG: 5,
            geminiConfidence: 0.9,
            isManuallyAdjusted: false
        )

        let weighIn = WeighIn(
            id: weighInId,
            userId: userId,
            date: timestamp,
            weightKg: 78.5,
            calculatedTDEE: 2400,
            adjustedDailyTarget: 2050,
            bmi: 24.5,
            sourceIsHealthKit: false
        )

        let csv = DataExportService.makeCSV(meals: [meal], weighIns: [weighIn])

        XCTAssertTrue(csv.contains("# meals"))
        XCTAssertTrue(csv.contains("# weigh_ins"))
        XCTAssertTrue(csv.contains("id,userId,timestamp,mealType,calories"))
        XCTAssertTrue(csv.contains("id,userId,date,weightKg,tdee,target,bmi,sourceIsHealthKit"))
        XCTAssertTrue(csv.contains(mealId.uuidString))
        XCTAssertTrue(csv.contains(weighInId.uuidString))
        XCTAssertTrue(csv.contains("500"))
        XCTAssertTrue(csv.contains("78.5"))
        XCTAssertFalse(csv.contains("photoData"))
    }

    @MainActor
    func testEmptyDisplayNameIsValidAndPersists() async throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: UserProfile.self, configurations: config)
        let context = container.mainContext
        let repository = UserProfileRepository()

        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2300,
            deficitKcal: 300
        )
        context.insert(profile)
        try context.save()

        let viewModel = SettingsViewModel(
            userProfileRepository: repository,
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository(),
            healthKitService: HealthKitService(),
            geminiService: GeminiService(),
            notificationManager: NotificationManager()
        )
        viewModel.load(context: context)
        viewModel.updateDraft { $0.name = "" }

        XCTAssertTrue(viewModel.canSaveProfile)
        XCTAssertNil(viewModel.profileValidationMessage)

        await viewModel.saveProfile(context: context)

        let saved = try XCTUnwrap(repository.fetchPrimaryProfile(context: context))
        XCTAssertEqual(saved.name, "")
    }
}
