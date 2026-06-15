import Foundation

struct AnalyticsAggregator {
    static func loggedDailySummaries(
        from meals: [MealEntry],
        calendar: Calendar = .current
    ) -> [DailyNutritionSummary] {
        var byDay: [Date: DailyNutritionSummary] = [:]

        for meal in meals {
            let day = calendar.startOfDay(for: meal.timestamp)
            if var existing = byDay[day] {
                existing = DailyNutritionSummary(
                    date: day,
                    calories: existing.calories + meal.totalCalories,
                    proteinG: existing.proteinG + meal.totalProteinG,
                    carbsG: existing.carbsG + meal.totalCarbsG,
                    fatG: existing.fatG + meal.totalFatG,
                    fiberG: existing.fiberG + meal.totalFiberG
                )
                byDay[day] = existing
            } else {
                byDay[day] = DailyNutritionSummary(
                    date: day,
                    calories: meal.totalCalories,
                    proteinG: meal.totalProteinG,
                    carbsG: meal.totalCarbsG,
                    fatG: meal.totalFatG,
                    fiberG: meal.totalFiberG
                )
            }
        }

        return byDay.values.sorted { $0.date < $1.date }
    }

    static func chartDailySeries(
        loggedDays: [DailyNutritionSummary],
        from start: Date,
        through end: Date,
        calendar: Calendar = .current
    ) -> [DailyNutritionSummary] {
        let windowStart = calendar.startOfDay(for: start)
        let windowEnd = calendar.startOfDay(for: end)
        guard windowStart <= windowEnd else { return [] }

        let loggedByDay = Dictionary(uniqueKeysWithValues: loggedDays.map { ($0.date, $0) })
        var series: [DailyNutritionSummary] = []
        var cursor = windowStart

        while cursor <= windowEnd {
            if let logged = loggedByDay[cursor] {
                series.append(logged)
            } else {
                series.append(
                    DailyNutritionSummary(
                        date: cursor,
                        calories: 0,
                        proteinG: 0,
                        carbsG: 0,
                        fatG: 0,
                        fiberG: 0
                    )
                )
            }
            guard let next = calendar.date(byAdding: .day, value: 1, to: cursor) else { break }
            cursor = next
        }

        return series
    }

    static func adherencePercent(
        loggedDays: [DailyNutritionSummary],
        calorieTarget: Int
    ) -> Double {
        guard calorieTarget > 0, !loggedDays.isEmpty else { return 0 }

        let onTargetCount = loggedDays.count { day in
            CalorieProgressBand.isCalorieIntakeOnTarget(calories: day.calories, target: calorieTarget)
        }
        return Double(onTargetCount) / Double(loggedDays.count) * 100
    }

    static func averageDailyCalories(loggedDays: [DailyNutritionSummary]) -> Double {
        guard !loggedDays.isEmpty else { return 0 }
        return Double(loggedDays.reduce(0) { $0 + $1.calories }) / Double(loggedDays.count)
    }

    static func macroSplit(
        proteinG: Double,
        carbsG: Double,
        fatG: Double
    ) -> MacroSplit {
        NutritionCalculator.macroPercents(
            proteinG: proteinG,
            carbsG: carbsG,
            fatG: fatG
        )
    }

    static func daysMeetingFiberTarget(
        loggedDays: [DailyNutritionSummary],
        fiberTargetG: Double
    ) -> Int {
        guard fiberTargetG > 0 else { return 0 }
        return loggedDays.count { $0.fiberG >= fiberTargetG }
    }

    static func dayOfWeekBreakdown(
        meals: [MealEntry],
        calendar: Calendar = .current
    ) -> [Weekday: Int] {
        var totals: [Weekday: Int] = [:]
        for meal in meals {
            let weekdayValue = calendar.component(.weekday, from: meal.timestamp)
            guard let weekday = Weekday(calendarWeekday: weekdayValue) else { continue }
            totals[weekday, default: 0] += meal.totalCalories
        }
        return totals
    }

    static func timeOfDayBreakdown(
        meals: [MealEntry],
        calendar: Calendar = .current
    ) -> [TimeOfDayBucket: Int] {
        var totals: [TimeOfDayBucket: Int] = [:]
        for meal in meals {
            let hour = calendar.component(.hour, from: meal.timestamp)
            let bucket = TimeOfDayBucket.bucket(for: hour)
            totals[bucket, default: 0] += meal.totalCalories
        }
        return totals
    }

    static func weekendWeekdayAverages(
        loggedDays: [DailyNutritionSummary],
        calendar: Calendar = .current
    ) -> (weekend: Double, weekday: Double)? {
        var weekendDays: [DailyNutritionSummary] = []
        var weekdayDays: [DailyNutritionSummary] = []

        for day in loggedDays {
            let weekdayValue = calendar.component(.weekday, from: day.date)
            guard let weekday = Weekday(calendarWeekday: weekdayValue) else { continue }
            if weekday.isWeekend {
                weekendDays.append(day)
            } else {
                weekdayDays.append(day)
            }
        }

        guard !weekendDays.isEmpty, !weekdayDays.isEmpty else { return nil }

        let weekendAvg = Double(weekendDays.reduce(0) { $0 + $1.calories }) / Double(weekendDays.count)
        let weekdayAvg = Double(weekdayDays.reduce(0) { $0 + $1.calories }) / Double(weekdayDays.count)
        return (weekend: weekendAvg, weekday: weekdayAvg)
    }

    static func topFoods(
        meals: [MealEntry],
        limit: Int
    ) -> [TopFoodEntry] {
        guard limit > 0 else { return [] }

        struct Accumulator {
            var displayName: String
            var count: Int
            var totalCalories: Int
        }

        var grouped: [String: Accumulator] = [:]

        for meal in meals {
            for item in meal.items {
                let trimmed = item.name.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { continue }
                let key = trimmed.lowercased()
                if var existing = grouped[key] {
                    existing.count += 1
                    existing.totalCalories += item.calories
                    grouped[key] = existing
                } else {
                    grouped[key] = Accumulator(
                        displayName: trimmed,
                        count: 1,
                        totalCalories: item.calories
                    )
                }
            }
        }

        return grouped.values
            .sorted { lhs, rhs in
                if lhs.count != rhs.count { return lhs.count > rhs.count }
                return lhs.displayName < rhs.displayName
            }
            .prefix(limit)
            .map { entry in
                TopFoodEntry(
                    name: entry.displayName,
                    count: entry.count,
                    avgCalories: entry.totalCalories / entry.count
                )
            }
    }

}
