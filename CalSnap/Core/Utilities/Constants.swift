enum AppConstants {
    enum Gemini {
        static let model = "gemini-2.5-flash"
        static let maxTokens = 2048
        static let confidenceThreshold: Double = 0.60
    }

    enum Nutrition {
        static let carbsCalPerGram: Double = 4.0
        static let proteinCalPerGram: Double = 4.0
        static let fatCalPerGram: Double = 9.0
        static let fiberCalPerGram: Double = 2.0
        static let alcoholCalPerGram: Double = 7.0
    }

    enum Deficit {
        static let defaultDeficitKcal: Int = 350
        static let minDeficitKcal: Int = 250
        static let maxDeficitKcal: Int = 500
        static let hardMaxDeficitKcal: Int = 750
        static let minCaloriesMale: Int = 1500
        static let minCaloriesFemale: Int = 1200
    }

    enum ActivityMultipliers {
        static let sedentary: Double = 1.2
        static let lightlyActive: Double = 1.375
        static let moderatelyActive: Double = 1.55
        static let veryActive: Double = 1.725
        static let extraActive: Double = 1.9
    }

    enum Plateau {
        static let weeksToDetect: Int = 3
        static let weightChangeThresholdKg: Double = 0.23
    }

    enum USDA {
        static let baseURL = "https://api.nal.usda.gov/fdc/v1"
    }
}
