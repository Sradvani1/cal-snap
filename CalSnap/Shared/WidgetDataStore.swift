import Foundation

enum WidgetDataStore {
    static func save(_ data: WidgetData) {
        guard let defaults = UserDefaults(suiteName: WidgetConstants.appGroupSuiteName) else { return }
        guard let encoded = try? JSONEncoder().encode(data) else { return }
        defaults.set(encoded, forKey: WidgetConstants.storageKey)
    }

    static func load() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: WidgetConstants.appGroupSuiteName),
              let data = defaults.data(forKey: WidgetConstants.storageKey) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetData.self, from: data)
    }

    static func clear() {
        guard let defaults = UserDefaults(suiteName: WidgetConstants.appGroupSuiteName) else { return }
        defaults.removeObject(forKey: WidgetConstants.storageKey)
    }
}
