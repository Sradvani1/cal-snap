import Foundation
import SwiftData

struct WeighInRepository {
    func fetchWeighIns(
        for userId: UUID,
        from startOfWindow: Date,
        through endOfReferenceDay: Date,
        context: ModelContext
    ) throws -> [WeighIn] {
        let calendar = Calendar.current
        let windowStart = calendar.startOfDay(for: startOfWindow)
        let dayStart = calendar.startOfDay(for: endOfReferenceDay)
        guard let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) else {
            return []
        }

        let predicate = #Predicate<WeighIn> { weighIn in
            weighIn.userId == userId && weighIn.date >= windowStart && weighIn.date < dayEnd
        }
        var descriptor = FetchDescriptor<WeighIn>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.date)]
        )
        return try context.fetch(descriptor)
    }

    func fetchLatestWeighIns(
        for userId: UUID,
        count: Int,
        context: ModelContext
    ) throws -> [WeighIn] {
        let predicate = #Predicate<WeighIn> { weighIn in
            weighIn.userId == userId
        }
        var descriptor = FetchDescriptor<WeighIn>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.date)]
        )
        let all = try context.fetch(descriptor)
        guard count > 0 else { return [] }
        return Array(all.suffix(count))
    }
}
