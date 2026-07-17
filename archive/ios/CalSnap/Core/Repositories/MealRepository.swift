import Foundation
import SwiftData

enum MealRepositoryError: Error, Equatable {
    case mealNotFound
}

struct MealRepository {
    func fetchMeals(
        for userId: UUID,
        on calendarDay: Date,
        context: ModelContext
    ) throws -> [MealEntry] {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: calendarDay)
        guard let end = calendar.date(byAdding: .day, value: 1, to: start) else {
            return []
        }

        let predicate = #Predicate<MealEntry> { meal in
            meal.userId == userId && meal.timestamp >= start && meal.timestamp < end
        }
        var descriptor = FetchDescriptor<MealEntry>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.timestamp)]
        )
        return try context.fetch(descriptor)
    }

    func fetchMeals(
        for userId: UUID,
        from startOfWindow: Date,
        through endOfReferenceDay: Date,
        context: ModelContext
    ) throws -> [MealEntry] {
        let calendar = Calendar.current
        let windowStart = calendar.startOfDay(for: startOfWindow)
        let dayStart = calendar.startOfDay(for: endOfReferenceDay)
        guard let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) else {
            return []
        }

        let predicate = #Predicate<MealEntry> { meal in
            meal.userId == userId && meal.timestamp >= windowStart && meal.timestamp < dayEnd
        }
        var descriptor = FetchDescriptor<MealEntry>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.timestamp)]
        )
        return try context.fetch(descriptor)
    }

    func fetchMeal(id: UUID, context: ModelContext) throws -> MealEntry? {
        let mealId = id
        let predicate = #Predicate<MealEntry> { meal in
            meal.id == mealId
        }
        var descriptor = FetchDescriptor<MealEntry>(predicate: predicate)
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    func save(_ entry: MealEntry, context: ModelContext) throws {
        for item in entry.items {
            context.insert(item)
        }
        context.insert(entry)
        try context.save()
    }

    func update(_ entry: MealEntry, items: [FoodItem], context: ModelContext) throws {
        guard let existing = try fetchMeal(id: entry.id, context: context) else {
            throw MealRepositoryError.mealNotFound
        }

        existing.mealType = entry.mealType
        existing.photoData = entry.photoData
        existing.textDescription = entry.textDescription
        existing.totalCalories = entry.totalCalories
        existing.totalProteinG = entry.totalProteinG
        existing.totalCarbsG = entry.totalCarbsG
        existing.totalFatG = entry.totalFatG
        existing.totalFiberG = entry.totalFiberG
        existing.geminiConfidence = entry.geminiConfidence
        existing.isManuallyAdjusted = entry.isManuallyAdjusted
        existing.estimationNotes = entry.estimationNotes

        for item in existing.items {
            context.delete(item)
        }
        for item in items {
            context.insert(item)
        }
        existing.items = items

        try context.save()
    }

    func delete(id: UUID, context: ModelContext) throws {
        guard let meal = try fetchMeal(id: id, context: context) else {
            throw MealRepositoryError.mealNotFound
        }
        context.delete(meal)
        try context.save()
    }

    func fetchAll(for userId: UUID, context: ModelContext) throws -> [MealEntry] {
        let predicate = #Predicate<MealEntry> { meal in
            meal.userId == userId
        }
        let descriptor = FetchDescriptor<MealEntry>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.timestamp)]
        )
        return try context.fetch(descriptor)
    }
}
