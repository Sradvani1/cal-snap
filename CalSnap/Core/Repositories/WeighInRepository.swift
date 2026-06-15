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

    func fetchAll(
        for userId: UUID,
        sortDescending: Bool,
        context: ModelContext
    ) throws -> [WeighIn] {
        let predicate = #Predicate<WeighIn> { weighIn in
            weighIn.userId == userId
        }
        var descriptor = FetchDescriptor<WeighIn>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.date, order: sortDescending ? .reverse : .forward)]
        )
        return try context.fetch(descriptor)
    }

    func fetchWeeklyPlateauWeighIns(
        for userId: UUID,
        count: Int,
        minimumDaySpacing: Int = AppConstants.Notifications.weeklyPlateauMinimumDaySpacing,
        context: ModelContext
    ) throws -> [WeighIn] {
        let all = try fetchAll(for: userId, sortDescending: false, context: context)
        guard !all.isEmpty else { return [] }

        var selected: [WeighIn] = []
        var lastDate: Date?

        for weighIn in all.reversed() {
            if let lastDate {
                let days = Calendar.current.dateComponents([.day], from: weighIn.date, to: lastDate).day ?? 0
                guard days >= minimumDaySpacing else { continue }
            }
            selected.insert(weighIn, at: 0)
            lastDate = weighIn.date
            if selected.count == count { break }
        }

        return selected
    }

    func save(_ weighIn: WeighIn, context: ModelContext) throws {
        context.insert(weighIn)
        try context.save()
    }
}
