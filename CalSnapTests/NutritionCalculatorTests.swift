import XCTest
@testable import CalSnap

final class NutritionCalculatorTests: XCTestCase {
    func testBMRMale() {
        let bmr = NutritionCalculator.bmr(weightKg: 80, heightCm: 178, ageYears: 51, sex: .male)
        XCTAssertEqual(bmr, 1663, accuracy: 1)
    }

    func testBMRFemale() {
        let bmr = NutritionCalculator.bmr(weightKg: 65, heightCm: 163, ageYears: 48, sex: .female)
        XCTAssertEqual(bmr, 1268, accuracy: 1)
    }

    func testTDEE() {
        let tdee = NutritionCalculator.tdee(bmr: 1700, activityLevel: .moderatelyActive)
        XCTAssertEqual(tdee, 2635, accuracy: 0.1)
    }

    func testDailyTargetFloor() {
        let result = NutritionCalculator.dailyTarget(tdee: 2000, requestedDeficit: 1000, sex: .male)
        XCTAssertEqual(result.target, 1500)
        XCTAssertEqual(result.deficit, 750)
        XCTAssertTrue(result.warnings.contains(where: { $0.contains("1500") }))
    }

    func testDailyTargetWarnings() {
        let result = NutritionCalculator.dailyTarget(tdee: 3000, requestedDeficit: 800, sex: .male)
        XCTAssertEqual(result.deficit, 750)
        XCTAssertEqual(result.warnings.count, 2)
        XCTAssertTrue(result.warnings.contains(where: { $0.contains("750") }))
        XCTAssertTrue(result.warnings.contains(where: { $0.contains("500") }))
    }

    func testMacroTargets() {
        let macros = NutritionCalculator.macroTargets(
            dailyCalories: 2000,
            proteinPct: 0.28,
            carbsPct: 0.47,
            fatPct: 0.25
        )
        XCTAssertEqual(macros.proteinG, 140, accuracy: 0.1)
        XCTAssertEqual(macros.carbsG, 235, accuracy: 0.1)
        XCTAssertEqual(macros.fatG, 55.6, accuracy: 0.1)
    }

    func testBMI() {
        let bmi = NutritionCalculator.bmi(weightKg: 80, heightCm: 178)
        XCTAssertEqual(bmi, 25.2, accuracy: 0.1)
    }

    func testAgeFromDateOfBirth() {
        let dob = Calendar.current.date(byAdding: .year, value: -35, to: Date.now)!
        XCTAssertEqual(NutritionCalculator.age(from: dob), 35)
    }

    func testPlateauDetection() {
        let userId = UUID()
        let weighIns = [
            WeighIn(userId: userId, date: Date.now, weightKg: 80.0),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.1),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.15),
        ]
        XCTAssertTrue(NutritionCalculator.isOnPlateau(weighIns: weighIns))
    }

    func testPlateauDetectionInsufficientWeighIns() {
        let userId = UUID()
        let weighIns = [
            WeighIn(userId: userId, date: Date.now, weightKg: 80.0),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.1),
        ]
        XCTAssertFalse(NutritionCalculator.isOnPlateau(weighIns: weighIns))
    }

    func testPlateauDetectionWeightSpreadTooLarge() {
        let userId = UUID()
        let weighIns = [
            WeighIn(userId: userId, date: Date.now, weightKg: 80.0),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.15),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.25),
        ]
        XCTAssertFalse(NutritionCalculator.isOnPlateau(weighIns: weighIns))
    }

    func testPlateauDetectionUnsortedInput() {
        let userId = UUID()
        let calendar = Calendar.current
        let day1 = Date.now
        let day2 = calendar.date(byAdding: .day, value: -7, to: day1)!
        let day3 = calendar.date(byAdding: .day, value: -14, to: day1)!
        // Inserted out of chronological order; oldest entry should be ignored.
        let weighIns = [
            WeighIn(userId: userId, date: day2, weightKg: 80.1),
            WeighIn(userId: userId, date: day1, weightKg: 80.15),
            WeighIn(userId: userId, date: day3, weightKg: 79.0),
            WeighIn(userId: userId, date: day2, weightKg: 80.05),
        ]
        XCTAssertTrue(NutritionCalculator.isOnPlateau(weighIns: weighIns))
    }

    func testWeightProjection() {
        let results = NutritionCalculator.weightProjection(
            startWeightKg: 80,
            heightCm: 178,
            ageYears: 35,
            sex: .male,
            activityLevel: .moderatelyActive,
            dailyDeficitKcal: 350,
            weeks: 12
        )
        XCTAssertEqual(results.count, 13)
        for index in 1..<results.count {
            XCTAssertLessThan(results[index].weightKg, results[index - 1].weightKg)
        }
    }
}
