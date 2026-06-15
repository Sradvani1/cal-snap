import Foundation
import HealthKit

actor HealthKitService {
    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let bodyMass = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            types.insert(bodyMass)
        }
        if let height = HKObjectType.quantityType(forIdentifier: .height) {
            types.insert(height)
        }
        return types
    }

    private var writeTypes: Set<HKSampleType> {
        let identifiers: [HKQuantityTypeIdentifier] = [
            .dietaryEnergyConsumed,
            .dietaryProtein,
            .dietaryCarbohydrates,
            .dietaryFatTotal,
            .dietaryFiber,
            .bodyMass,
        ]
        return Set(identifiers.compactMap { HKObjectType.quantityType(forIdentifier: $0) })
    }

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
    }

    func logMeal(_ entry: MealEntry) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let timestamp = entry.timestamp
        var samples: [HKSample] = []

        if let calorieType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed) {
            samples.append(HKQuantitySample(
                type: calorieType,
                quantity: HKQuantity(unit: .kilocalorie(), doubleValue: Double(entry.totalCalories)),
                start: timestamp,
                end: timestamp
            ))
        }

        if let proteinType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein) {
            samples.append(HKQuantitySample(
                type: proteinType,
                quantity: HKQuantity(unit: .gram(), doubleValue: entry.totalProteinG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let carbsType = HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates) {
            samples.append(HKQuantitySample(
                type: carbsType,
                quantity: HKQuantity(unit: .gram(), doubleValue: entry.totalCarbsG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let fatType = HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal) {
            samples.append(HKQuantitySample(
                type: fatType,
                quantity: HKQuantity(unit: .gram(), doubleValue: entry.totalFatG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let fiberType = HKQuantityType.quantityType(forIdentifier: .dietaryFiber) {
            samples.append(HKQuantitySample(
                type: fiberType,
                quantity: HKQuantity(unit: .gram(), doubleValue: entry.totalFiberG),
                start: timestamp,
                end: timestamp
            ))
        }

        guard !samples.isEmpty else { return }
        try await store.save(samples)
    }

    func reverseMeal(_ snapshot: MealHealthSnapshot) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let timestamp = snapshot.timestamp
        var samples: [HKSample] = []

        if let calorieType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed) {
            samples.append(HKQuantitySample(
                type: calorieType,
                quantity: HKQuantity(unit: .kilocalorie(), doubleValue: -Double(snapshot.totalCalories)),
                start: timestamp,
                end: timestamp
            ))
        }

        if let proteinType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein) {
            samples.append(HKQuantitySample(
                type: proteinType,
                quantity: HKQuantity(unit: .gram(), doubleValue: -snapshot.totalProteinG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let carbsType = HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates) {
            samples.append(HKQuantitySample(
                type: carbsType,
                quantity: HKQuantity(unit: .gram(), doubleValue: -snapshot.totalCarbsG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let fatType = HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal) {
            samples.append(HKQuantitySample(
                type: fatType,
                quantity: HKQuantity(unit: .gram(), doubleValue: -snapshot.totalFatG),
                start: timestamp,
                end: timestamp
            ))
        }

        if let fiberType = HKQuantityType.quantityType(forIdentifier: .dietaryFiber) {
            samples.append(HKQuantitySample(
                type: fiberType,
                quantity: HKQuantity(unit: .gram(), doubleValue: -snapshot.totalFiberG),
                start: timestamp,
                end: timestamp
            ))
        }

        guard !samples.isEmpty else { return }
        try await store.save(samples)
    }
}
