import SwiftUI
import WidgetKit

struct CalorieWidgetEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct CalorieWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalorieWidgetEntry {
        CalorieWidgetEntry(date: Date.now, data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (CalorieWidgetEntry) -> Void) {
        completion(CalorieWidgetEntry(date: Date.now, data: WidgetDataStore.load() ?? .placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CalorieWidgetEntry>) -> Void) {
        let data = WidgetDataStore.load()
        let entry = CalorieWidgetEntry(date: Date.now, data: data)
        let refresh = Calendar.current.date(byAdding: .minute, value: 15, to: Date.now) ?? Date.now.addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

extension WidgetData {
    static var placeholder: WidgetData {
        WidgetData(
            displayName: "",
            targetCalories: 2000,
            consumedCalories: 1200,
            proteinConsumedG: 80,
            carbsConsumedG: 120,
            fatConsumedG: 40,
            proteinTargetG: 140,
            carbsTargetG: 235,
            fatTargetG: 55,
            updatedAt: Date.now
        )
    }
}
