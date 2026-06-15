import Foundation
import SwiftData

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

    func save(_ entry: MealEntry, context: ModelContext) throws {
        for item in entry.items {
            context.insert(item)
        }
        context.insert(entry)
        try context.save()
    }
}
