# CalSnap iOS App — Full Technical Specification for Cursor

> **Purpose:** This document is the definitive technical specification for building CalSnap from the ground up in Cursor. It is intended to be read alongside the companion science and product research document ("CalSnap: Science-Grounded Calorie Tracking iOS App — Full Spec & Research Foundation"). This spec is organized into a series of Pull Requests (PRs) that build cumulatively on each other. Each PR is a self-contained, reviewable unit of work with clear acceptance criteria.

***

## Project Overview

**App Name:** CalSnap  
**Platform:** iOS 26+  
**Language:** Swift 6.2 (Xcode `SWIFT_VERSION` = 6.0)  
**UI Framework:** SwiftUI  
**Architecture:** MVVM with `@MainActor @Observable` view models  
**Persistence:** SwiftData  
**AI Backend:** Google Gemini 2.5 Flash via Google AI SDK for Swift  
**Health Integration:** HealthKit  
**Package Manager:** Swift Package Manager (SPM)  
**Minimum Deployment:** iOS 26.0  
**Xcode Version:** 26.x  
**Target Devices:** iPhone only (portrait-primary)

**Agent skills:** Cursor applies `.agents/skills/swiftui-*` and `swift-language` for Swift/SwiftUI implementation detail. This spec and `engineering-rules.md` override skills for product scope, data model design, and PR boundaries.

**Swift 6 concurrency:** `SWIFT_STRICT_CONCURRENCY = complete`. View models, routers, and `AppContainer` use explicit `@MainActor` — do **not** enable project-wide `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` (it breaks SwiftData `@Model` types).

***

## Repository Structure

```
CalSnap/
├── CalSnap.xcodeproj
├── CalSnap/
│   ├── App/
│   │   ├── CalSnapApp.swift
│   │   └── AppContainer.swift          # DI container / environment setup
│   ├── Core/
│   │   ├── Models/                     # SwiftData model classes
│   │   │   ├── UserProfile.swift
│   │   │   ├── MealEntry.swift
│   │   │   ├── FoodItem.swift
│   │   │   └── WeighIn.swift
│   │   ├── Services/
│   │   │   ├── GeminiService.swift
│   │   │   ├── USDAService.swift
│   │   │   ├── HealthKitService.swift
│   │   │   └── NutritionCalculator.swift
│   │   ├── Repositories/
│   │   │   ├── MealRepository.swift
│   │   │   ├── WeighInRepository.swift
│   │   │   └── UserProfileRepository.swift
│   │   └── Utilities/
│   │       ├── Extensions/
│   │       ├── Constants.swift
│   │       └── KeychainManager.swift
│   ├── Features/
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   ├── MealScanner/
│   │   ├── MealLog/
│   │   ├── Progress/
│   │   ├── Analytics/
│   │   └── Settings/
│   ├── DesignSystem/
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   ├── Components/              # Reusable SwiftUI views
│   │   └── Modifiers/
│   └── Resources/
│       ├── Assets.xcassets
│       └── Info.plist
├── CalSnapTests/
└── CalSnapUITests/
```

***

## External Dependencies (Swift Package Manager)

```
// Package.swift dependencies
.package(url: "https://github.com/google/generative-ai-swift", from: "0.5.0"),
// No other third-party dependencies — keep the dependency tree minimal.
// All other functionality uses Apple frameworks: SwiftUI, SwiftData,
// HealthKit, PhotosUI, CryptoKit, Security (Keychain)
```

***

## Global Constants & Configuration

```swift
// Constants.swift
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
        static let hardMaxDeficitKcal: Int = 750  // requires user acknowledgment
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
        static let weightChangeThresholdKg: Double = 0.23  // ~0.5 lbs
    }
    enum USDA {
        static let baseURL = "https://api.nal.usda.gov/fdc/v1"
    }
}
```

***

## Core Data Models (SwiftData)

```swift
// UserProfile.swift
@Model
final class UserProfile {
    @Attribute(.unique) var id: UUID
    var name: String
    var sex: BiologicalSex          // enum: male, female
    var dateOfBirth: Date
    var heightCm: Double
    var startingWeightKg: Double
    var goalWeightKg: Double
    var goalTargetDate: Date
    var activityLevel: ActivityLevel // enum matching multiplier cases
    var dailyCalorieTarget: Int      // computed & stored on creation/recalc
    var tdee: Int
    var deficitKcal: Int
    var macroTargetProteinPct: Double   // 0.0–1.0
    var macroTargetCarbsPct: Double
    var macroTargetFatPct: Double
    var createdAt: Date
    var updatedAt: Date
    @Relationship(deleteRule: .cascade) var meals: [MealEntry]
    @Relationship(deleteRule: .cascade) var weighIns: [WeighIn]
}

// MealEntry.swift
@Model
final class MealEntry {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var timestamp: Date
    var mealType: MealType           // enum: breakfast, lunch, dinner, snack
    @Attribute(.externalStorage) var photoData: Data?
    var textDescription: String?
    var totalCalories: Int
    var totalProteinG: Double
    var totalCarbsG: Double
    var totalFatG: Double
    var totalFiberG: Double
    var geminiConfidence: Double
    var isManuallyAdjusted: Bool
    var estimationNotes: String?
    @Relationship(deleteRule: .cascade) var items: [FoodItem]
}

// FoodItem.swift
@Model
final class FoodItem {
    @Attribute(.unique) var id: UUID
    var name: String
    var estimatedWeightG: Double
    var calories: Int
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fiberG: Double
    var confidence: Double
    var usdaFoodId: String?         // populated if USDA fallback was used
    var isFlagged: Bool             // true if confidence < threshold
}

// WeighIn.swift
@Model
final class WeighIn {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var date: Date
    var weightKg: Double
    var calculatedTDEE: Int
    var adjustedDailyTarget: Int
    var bmi: Double
    var sourceIsHealthKit: Bool
}
```

**SwiftData notes:** `@Attribute(.unique)` is used for local-only storage. If CloudKit sync is added later, remove `.unique` and make relationships optional per SwiftData+CloudKit requirements.

***

## Enumerations

```swift
enum BiologicalSex: String, Codable, CaseIterable {
    case male, female
}

enum ActivityLevel: String, Codable, CaseIterable {
    case sedentary       = "Sedentary"
    case lightlyActive   = "Lightly Active"
    case moderatelyActive = "Moderately Active"
    case veryActive      = "Very Active"
    case extraActive     = "Extra Active"
    
    var multiplier: Double {
        switch self {
        case .sedentary: return AppConstants.ActivityMultipliers.sedentary
        case .lightlyActive: return AppConstants.ActivityMultipliers.lightlyActive
        case .moderatelyActive: return AppConstants.ActivityMultipliers.moderatelyActive
        case .veryActive: return AppConstants.ActivityMultipliers.veryActive
        case .extraActive: return AppConstants.ActivityMultipliers.extraActive
        }
    }
    
    var description: String {
        switch self {
        case .sedentary: return "Desk job, minimal movement"
        case .lightlyActive: return "Light exercise 1–3 days/week"
        case .moderatelyActive: return "Moderate exercise 3–5 days/week"
        case .veryActive: return "Hard exercise 6–7 days/week"
        case .extraActive: return "Physical job + hard daily exercise"
        }
    }
}

enum MealType: String, Codable, CaseIterable {
    case breakfast, lunch, dinner, snack
    
    static func suggested(for date: Date) -> MealType {
        let hour = Calendar.current.component(.hour, from: date)
        switch hour {
        case 5..<11: return .breakfast
        case 11..<15: return .lunch
        case 15..<18: return .snack
        default: return .dinner
        }
    }
}
```

***

## Service Layer Interfaces

### NutritionCalculator (Pure Swift, No Dependencies)

```swift
// NutritionCalculator.swift
struct NutritionCalculator {
    
    // Mifflin-St Jeor BMR
    static func bmr(weightKg: Double, heightCm: Double, ageYears: Int, sex: BiologicalSex) -> Double {
        let base = (10 * weightKg) + (6.25 * heightCm) - (5 * Double(ageYears))
        return sex == .male ? base + 5 : base - 161
    }
    
    // TDEE
    static func tdee(bmr: Double, activityLevel: ActivityLevel) -> Double {
        return bmr * activityLevel.multiplier
    }
    
    // Compute safe daily calorie target
    // Returns (target, deficit, warnings)
    static func dailyTarget(
        tdee: Double,
        requestedDeficit: Int,
        sex: BiologicalSex
    ) -> (target: Int, deficit: Int, warnings: [String]) {
        var warnings: [String] = []
        var deficit = requestedDeficit
        
        if deficit > AppConstants.Deficit.hardMaxDeficitKcal {
            deficit = AppConstants.Deficit.hardMaxDeficitKcal
            warnings.append("Deficit capped at \(AppConstants.Deficit.hardMaxDeficitKcal) kcal/day for safety.")
        }
        if deficit > AppConstants.Deficit.maxDeficitKcal {
            warnings.append("Deficits above \(AppConstants.Deficit.maxDeficitKcal) kcal/day can trigger metabolic adaptation. Recommend 350 kcal/day.")
        }
        
        let minimum = sex == .male 
            ? AppConstants.Deficit.minCaloriesMale 
            : AppConstants.Deficit.minCaloriesFemale
        let rawTarget = Int(tdee) - deficit
        let target = max(rawTarget, minimum)
        
        if rawTarget < minimum {
            warnings.append("Target floored to \(minimum) kcal/day minimum for safety.")
        }
        return (target, deficit, warnings)
    }
    
    // Macro gram targets from calorie target and percentage splits
    static func macroTargets(
        dailyCalories: Int,
        proteinPct: Double,
        carbsPct: Double,
        fatPct: Double
    ) -> (proteinG: Double, carbsG: Double, fatG: Double) {
        let kcal = Double(dailyCalories)
        return (
            proteinG: (kcal * proteinPct) / AppConstants.Nutrition.proteinCalPerGram,
            carbsG: (kcal * carbsPct) / AppConstants.Nutrition.carbsCalPerGram,
            fatG: (kcal * fatPct) / AppConstants.Nutrition.fatCalPerGram
        )
    }
    
    // BMI
    static func bmi(weightKg: Double, heightCm: Double) -> Double {
        let heightM = heightCm / 100
        return weightKg / (heightM * heightM)
    }
    
    // Age in years from date of birth
    static func age(from dob: Date) -> Int {
        return Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0
    }
    
    // Dynamic deficit-based weight loss projection (not static 3500-cal rule)
    // Returns array of (weekNumber, projectedWeightKg) using iterative model
    static func weightProjection(
        startWeightKg: Double,
        heightCm: Double,
        ageYears: Int,
        sex: BiologicalSex,
        activityLevel: ActivityLevel,
        dailyDeficitKcal: Int,
        weeks: Int
    ) -> [(week: Int, weightKg: Double)] {
        var results: [(Int, Double)] = [(0, startWeightKg)]
        var currentWeight = startWeightKg
        
        for week in 1...weeks {
            let currentBMR = bmr(weightKg: currentWeight, heightCm: heightCm, 
                                  ageYears: ageYears, sex: sex)
            let currentTDEE = tdee(bmr: currentBMR, activityLevel: activityLevel)
            // Weekly deficit in kcal; 7,700 kcal ≈ 1 kg of mixed tissue (corrected from 7,000)
            let weeklyDeficit = Double(dailyDeficitKcal) * 7.0
            // Apply metabolic adaptation factor (simplified: 5% adaptation after 4 weeks)
            let adaptationFactor = week > 4 ? 0.95 : 1.0
            let effectiveDeficit = weeklyDeficit * adaptationFactor
            let weightLossKg = effectiveDeficit / 7700.0
            currentWeight = max(currentWeight - weightLossKg, currentWeight * 0.7) // safety floor
            results.append((week, currentWeight))
        }
        return results
    }
    
    // Plateau detection: true if last N weigh-ins show < threshold change
    static func isOnPlateau(weighIns: [WeighIn]) -> Bool {
        guard weighIns.count >= AppConstants.Plateau.weeksToDetect else { return false }
        let recent = weighIns.suffix(AppConstants.Plateau.weeksToDetect)
        guard let minWeight = recent.map(\.weightKg).min(),
              let maxWeight = recent.map(\.weightKg).max() else { return false }
        return (maxWeight - minWeight) < AppConstants.Plateau.weightChangeThresholdKg
    }
}
```

### GeminiService

```swift
// GeminiService.swift
import GoogleGenerativeAI

struct MealAnalysisRequest {
    let imageData: Data
    let mimeType: String        // "image/jpeg" or "image/png"
    let textDescription: String?
}

struct MealAnalysisResponse: Codable {
    struct FoodItemResult: Codable {
        let name: String
        let estimatedWeightG: Double
        let calories: Int
        let proteinG: Double
        let carbsG: Double
        let fatG: Double
        let fiberG: Double
        let confidence: Double
    }
    struct MealTotal: Codable {
        let calories: Int
        let proteinG: Double
        let carbsG: Double
        let fatG: Double
        let fiberG: Double
    }
    let items: [FoodItemResult]
    let mealTotal: MealTotal
    let flaggedItems: [String]
    let estimationNotes: String
}

actor GeminiService {
    private let model: GenerativeModel
    
    init(apiKey: String) {
        self.model = GenerativeModel(
            name: AppConstants.Gemini.model,
            apiKey: apiKey,
            generationConfig: GenerationConfig(
                responseMIMEType: "application/json",
                responseSchema: GeminiService.responseSchema
            )
        )
    }
    
    func analyzeMeal(_ request: MealAnalysisRequest) async throws -> MealAnalysisResponse {
        let prompt = buildPrompt(description: request.textDescription)
        let imagePart = ModelContent.Part.data(
            mimetype: request.mimeType,
            Data(request.imageData)
        )
        let textPart = ModelContent.Part.text(prompt)
        let response = try await model.generateContent([textPart, imagePart])
        
        guard let text = response.text,
              let data = text.data(using: .utf8) else {
            throw GeminiError.emptyResponse
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(MealAnalysisResponse.self, from: data)
    }
    
    private func buildPrompt(description: String?) -> String {
        var prompt = """
        Analyze this meal image and return a JSON nutritional breakdown.
        
        For each food item you can identify, estimate:
        - The item name (specific, e.g. "grilled chicken breast" not just "chicken")
        - Estimated weight in grams (use plate size, utensils, and visual proportion as references)
        - Calories
        - Protein in grams
        - Carbohydrates in grams (excluding fiber)
        - Fat in grams
        - Fiber in grams
        - Confidence score 0.0–1.0 (be honest; reduce confidence for partially visible items, 
          unclear sauces/dressings, or ambiguous portions)
        
        Use standard USDA nutritional values as your reference database.
        Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.
        
        Flag any item with confidence below 0.6 in the flaggedItems array.
        Include brief estimation_notes explaining your reasoning for portion sizes.
        """
        
        if let description = description, !description.isEmpty {
            prompt += "\n\nAdditional context from user: \(description)\nUse this to refine your estimates."
        }
        
        return prompt
    }
    
    private static var responseSchema: Schema {
        // Schema definition for structured JSON output enforcement
        return .object(properties: [
            "items": .array(items: .object(properties: [
                "name": .string(),
                "estimated_weight_g": .number(),
                "calories": .integer(),
                "protein_g": .number(),
                "carbs_g": .number(),
                "fat_g": .number(),
                "fiber_g": .number(),
                "confidence": .number()
            ])),
            "meal_total": .object(properties: [
                "calories": .integer(),
                "protein_g": .number(),
                "carbs_g": .number(),
                "fat_g": .number(),
                "fiber_g": .number()
            ]),
            "flagged_items": .array(items: .string()),
            "estimation_notes": .string()
        ])
    }
}

enum GeminiError: Error, LocalizedError {
    case emptyResponse
    case invalidJSON(String)
    case apiKeyMissing
    
    var errorDescription: String? {
        switch self {
        case .emptyResponse: return "Gemini returned an empty response."
        case .invalidJSON(let msg): return "Could not parse Gemini response: \(msg)"
        case .apiKeyMissing: return "Gemini API key not configured. Go to Settings to add it."
        }
    }
}
```

### USDAService (Fallback)

```swift
// USDAService.swift
struct USDAFoodItem: Codable {
    let fdcId: Int
    let description: String
    let foodNutrients: [USDANutrient]
}
struct USDANutrient: Codable {
    let nutrientId: Int
    let nutrientName: String
    let value: Double
}

actor USDAService {
    private let apiKey: String
    private let session = URLSession.shared
    
    // USDA Nutrient IDs
    enum NutrientID: Int {
        case energy = 1008
        case protein = 1003
        case totalCarbs = 1005
        case totalFat = 1004
        case fiber = 1079
    }
    
    init(apiKey: String) { self.apiKey = apiKey }
    
    func search(query: String) async throws -> [USDAFoodItem] {
        var components = URLComponents(string: "\(AppConstants.USDA.baseURL)/foods/search")!
        components.queryItems = [
            .init(name: "query", value: query),
            .init(name: "pageSize", value: "5"),
            .init(name: "api_key", value: apiKey)
        ]
        let (data, _) = try await session.data(from: components.url!)
        // Parse and return top results
        struct SearchResponse: Codable { let foods: [USDAFoodItem] }
        return try JSONDecoder().decode(SearchResponse.self, from: data).foods
    }
}
```

### HealthKitService

```swift
// HealthKitService.swift
import HealthKit

actor HealthKitService {
    private let store = HKHealthStore()
    
    // Types to read
    private let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .bodyMass)!,
        HKObjectType.quantityType(forIdentifier: .height)!
    ]
    
    // Types to write
    private let writeTypes: Set<HKSampleType> = [
        HKObjectType.quantityType(forIdentifier: .dietaryEnergyConsumed)!,
        HKObjectType.quantityType(forIdentifier: .dietaryProtein)!,
        HKObjectType.quantityType(forIdentifier: .dietaryCarbohydrates)!,
        HKObjectType.quantityType(forIdentifier: .dietaryFatTotal)!,
        HKObjectType.quantityType(forIdentifier: .dietaryFiber)!,
        HKObjectType.quantityType(forIdentifier: .bodyMass)!
    ]
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
    }
    
    func logMeal(_ entry: MealEntry) async throws {
        let now = entry.timestamp
        var samples: [HKSample] = []
        
        let calorieType = HKQuantityType(.dietaryEnergyConsumed)
        samples.append(HKQuantitySample(
            type: calorieType,
            quantity: HKQuantity(unit: .kilocalorie(), doubleValue: Double(entry.totalCalories)),
            start: now, end: now
        ))
        // Add protein, carbs, fat, fiber similarly...
        try await store.save(samples)
    }
    
    func fetchLatestWeight() async throws -> Double? {
        let bodyMassType = HKQuantityType(.bodyMass)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: bodyMassType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                let kg = (samples?.first as? HKQuantitySample)?
                    .quantity.doubleValue(for: .gramUnit(with: .kilo))
                continuation.resume(returning: kg)
            }
            store.execute(query)
        }
    }
    
    func saveWeight(_ kg: Double, date: Date) async throws {
        let sample = HKQuantitySample(
            type: HKQuantityType(.bodyMass),
            quantity: HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: kg),
            start: date, end: date
        )
        try await store.save(sample)
    }
}
```

### KeychainManager

```swift
// KeychainManager.swift
import Security

enum KeychainKey: String {
    case geminiAPIKey = "com.calsnap.gemini_api_key"
    case usdaAPIKey   = "com.calsnap.usda_api_key"
}

struct KeychainManager {
    static func save(_ value: String, for key: KeychainKey) throws {
        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key.rawValue,
            kSecValueData: data,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }
    
    static func load(for key: KeychainKey) throws -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key.rawValue,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    static func delete(for key: KeychainKey) {
        let query: [CFString: Any] = [kSecClass: kSecClassGenericPassword, kSecAttrAccount: key.rawValue]
        SecItemDelete(query as CFDictionary)
    }
}

enum KeychainError: Error {
    case saveFailed(OSStatus)
}
```

***

## Navigation Architecture

- Root feature flows use `NavigationStack(path:)` with typed `Hashable` route enums (e.g. `DashboardRoute`, `MealScannerRoute`).
- SwiftData models used in routes implement stable `Hashable` via `id` only.
- Register destinations with `.navigationDestination(for:)` — never use deprecated `NavigationView` or `NavigationLink(destination:)`.
- Do not mix `navigationDestination(for:)` and `NavigationLink(destination:)` in the same hierarchy.
- Sheets: prefer `.sheet(item:)` for model-driven presentation (weigh-in draft, plateau context, editable meal); use `.sheet(isPresented:)` only for simple boolean UI (e.g. share sheet).
- Sheets own their dismiss logic internally; use `.presentationSizing(.form)` for form-style sheets.
- Each tab (if added) gets its own `NavigationStack` and independent `NavigationPath`.
- Deep links: centralize URL parsing in a `@MainActor @Observable` router; handle via `.onOpenURL`.

***

## PR Breakdown

Each PR below is a self-contained unit. Cursor should implement them in order. Each PR depends on all prior PRs being merged and green. Every PR must have passing unit tests for the business logic layer before merge.

***

### PR 1: Project Scaffold & Core Infrastructure

**Goal:** Set up the project skeleton, constants, SwiftData models, pure calculation utilities, and unit tests. The only UI is a blank placeholder screen. No user-facing product flows, external services, or third-party packages.

**Files to create:**
- `CalSnap.xcodeproj` — New Xcode project (SwiftUI App lifecycle, SwiftData enabled, no storyboard)
- `.gitignore` — Standard Xcode/SwiftPM ignores (include `*.xcconfig`, `DerivedData/`, `.DS_Store`)
- `CalSnap/App/CalSnapApp.swift` — App entry point, SwiftData model container setup
- `CalSnap/App/RootView.swift` — Placeholder root view (solid background only; no navigation or feature UI)
- `CalSnap/App/AppContainer.swift` — Empty DI shell for later PRs (see PR1 constraints below)
- `CalSnap/Core/Utilities/Constants.swift` — Full constants file as specified above
- `CalSnap/Core/Models/Enums.swift` — `BiologicalSex`, `ActivityLevel`, `MealType` (including `MealType.suggested(for:)`)
- `CalSnap/Core/Utilities/KeychainManager.swift`
- `CalSnap/Core/Models/UserProfile.swift`
- `CalSnap/Core/Models/MealEntry.swift`
- `CalSnap/Core/Models/FoodItem.swift`
- `CalSnap/Core/Models/WeighIn.swift`
- `CalSnap/Core/Services/NutritionCalculator.swift` — Full static utility (all methods in the Service Layer section above)
- `CalSnapTests/NutritionCalculatorTests.swift`
- `CalSnapTests/KeychainManagerTests.swift`

**Xcode project settings (PR1):**
- Product name: `CalSnap`
- Bundle identifier: `com.calsnap.app`
- Deployment target: iOS 26.0
- Supported destinations: iPhone only
- Swift Package Manager: **no third-party packages in PR1** (Gemini SDK is added in PR4)

**`AppContainer` (PR1 only):**
- Define an `@MainActor @Observable` type with no service dependencies.
- Inject via SwiftUI environment from `CalSnapApp` so later PRs can extend it without renaming.
- Do not initialize Gemini, USDA, HealthKit, or repository types in PR1.

**`UserProfile` model defaults (PR1 only):**
- Store macro percentages as fractions (`0.0–1.0`).
- Default at model creation: protein `0.28`, carbs `0.47`, fat `0.25` (sums to `1.0`; aligns with product-research §12 step 7).
- Minimum calorie floor uses `AppConstants.Deficit` lower bounds only: male `1500`, female `1200`.

**`NutritionCalculator` scope note (PR1):**
- Implement `weightProjection` and `isOnPlateau` in PR1 as pure functions with unit tests only.
- No plateau UI, weigh-in flow, or dashboard logic in PR1.

**Explicitly out of scope for PR1:**
- Onboarding, Dashboard, Settings, and all feature views
- `GeminiService`, `USDAService`, `HealthKitService`, and all repositories
- Swift Package Manager dependencies (including `generative-ai-swift`)
- HealthKit, camera, photo library, and notification permissions or Info.plist usage strings beyond a minimal plist if required to build
- `#Preview` blocks are required only for `RootView.swift` in PR1 (not for model or service files)

**SwiftData container setup in `CalSnapApp.swift`:**
```swift
@main
struct CalSnapApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self])
    }
}
```

**Test requirements — `NutritionCalculatorTests`:**
- `testBMRMale()` — male, 51 years, 80 kg, 178 cm → **1663 kcal** (±1 kcal tolerance)
- `testBMRFemale()` — female, 48 years, 65 kg, 163 cm → **1268 kcal** (±1 kcal tolerance)
- `testTDEE()` — BMR 1700 × 1.55 → 2635
- `testDailyTargetFloor()` — male TDEE with large deficit floors target at **1500**
- `testDailyTargetWarnings()` — requested deficit **800** produces warnings; applied deficit capped at **750**
- `testMacroTargets()` — 2000 kcal at 0.28 / 0.47 / 0.25 → protein **140 g**, carbs **235 g**, fat **55.6 g** (±0.1 g tolerance on fat)
- `testBMI()` — 80 kg, 178 cm → **25.2** (±0.1 tolerance)
- `testPlateauDetection()` — 3 weigh-ins within 0.23 kg span → `true`
- `testWeightProjection()` — 12-week call returns **13** `(week, weightKg)` pairs; weights strictly decrease week-over-week

**Test requirements — `KeychainManagerTests`:**
- Use a **PR1-only test key** (e.g. `com.calsnap.test_key`) defined in the test target, not production `KeychainKey` cases.
- `testSaveLoadDeleteRoundTrip()` — save → load matches → delete → load returns nil
- Run on simulator; no Keychain mocking required in PR1

**Acceptance criteria:**
- Project builds and runs on iPhone simulator showing a blank placeholder screen (`RootView`)
- SwiftData `modelContainer` initializes without crash on launch
- No Swift Package Manager dependencies added
- All unit tests in `CalSnapTests` pass
- `NutritionCalculatorTests` and `KeychainManagerTests` cover the cases listed above

***

### PR 2: User Profile & Onboarding Flow

**Goal:** Complete onboarding flow for first-time launch. Creates and persists UserProfile. Handles dual-user setup.

**Feature: Onboarding (multi-step form)**

Screen sequence:
1. **Welcome** — App name, tagline ("Eat smart. Lose weight. No obsession."), two profile name inputs ("Your name" + "Partner's name" — partner is optional)
2. **Profile Setup (per user)** — Name, sex picker, date of birth (date picker, 18–90 years), height (ft/in picker with cm toggle), current weight (lbs/kg toggle)
3. **Goal Setup** — Goal weight, target date (date picker, 2 weeks minimum from today, 2 years maximum), activity level (card-style picker with description and icon per level)
4. **Calorie Target Preview** — Shows calculated TDEE, recommended deficit, daily calorie target, macro targets in a summary card. Science blurb: "This estimate has a natural ±15% variance. Your real number reveals itself over 2–3 weeks of tracking." Deficit slider (250–500, with 750 unlockable via toggle + acknowledgment alert)
5. **HealthKit Permission** — Request HealthKit authorization with brief explanation
6. **API Key Setup** — Gemini API key input (secure text field → Keychain), test button that fires a trivial Gemini call to validate key, success/failure indicator. USDA API key input (optional, defaults to demo key)
7. **Done** → navigate to Dashboard

**ViewModel: `OnboardingViewModel`**
```swift
@MainActor
@Observable
class OnboardingViewModel {
    var currentStep: OnboardingStep = .welcome
    var profileA = ProfileDraft()
    var profileB = ProfileDraft()        // optional second user
    var activeProfile: ProfileDraft = .init()
    var calculatedTDEE: Int = 0
    var calculatedTarget: Int = 0
    var calculatedDeficit: Int = 350
    var warnings: [String] = []
    var isCalculating: Bool = false
    
    func calculateTargets() { ... }      // calls NutritionCalculator
    func saveProfiles(context: ModelContext) throws { ... }
    func testGeminiKey(_ key: String) async -> Bool { ... }
}

struct ProfileDraft {
    var name: String = ""
    var sex: BiologicalSex = .male
    var dateOfBirth: Date = Calendar.current.date(byAdding: .year, value: -35, to: Date())!
    var heightCm: Double = 175
    var weightKg: Double = 80
    var goalWeightKg: Double = 72
    var goalTargetDate: Date = Calendar.current.date(byAdding: .month, value: 6, to: Date())!
    var activityLevel: ActivityLevel = .moderatelyActive
    var requestedDeficit: Int = 350
}
```

**Test requirements:**
- `testOnboardingValidation()` — blank name prevents advance
- `testGoalDateMinimum()` — date < 2 weeks from today is rejected
- `testProfilePersistence()` — ProfileDraft → UserProfile → SwiftData round-trip

**Acceptance criteria:**
- Full onboarding flow navigable on iPhone simulator
- UserProfile(s) persisted to SwiftData on completion
- HealthKit authorization request fires on step 5
- Gemini API key stored in Keychain, not UserDefaults
- App skips onboarding on second launch if profile exists

***

### PR 3: Dashboard — Core Daily View

**Goal:** The primary home screen. Shows today's calorie ring, macro breakdown, meal list, and quick-add button.

**Layout: `DashboardView`**

```
[Profile Switcher — top right, avatar + name]
[Greeting + date]

[CalorieRingCard]
  ├── Large circular progress ring (consumed / target)
  ├── Center: remaining calories (large bold number)
  ├── Subtitle: "of {target} kcal goal"
  └── Color: green < 90%, yellow 90–110%, red > 110%

[MacroBarCard]
  ├── Three horizontal segmented bars: Protein | Carbs | Fat
  ├── Each bar shows consumed g / target g
  └── Fiber as a separate narrow bar below

[TodaysMealsSection]
  ├── List of MealEntry cards for today (grouped by MealType)
  ├── Each card: meal type icon, time, calorie count, thumbnail
  └── Tap → MealDetailView

[WeightTrendMiniChart]
  └── 7-day sparkline (weight in lbs or kg)

[FAB: "+" button → MealScannerView]
```

**ViewModel: `DashboardViewModel`**
```swift
@MainActor
@Observable
class DashboardViewModel {
    var activeProfile: UserProfile?
    var todaysMeals: [MealEntry] = []
    var todaysCalories: Int = 0
    var todaysProteinG: Double = 0
    var todaysCarbsG: Double = 0
    var todaysFatG: Double = 0
    var todaysFiberG: Double = 0
    var recentWeighIns: [WeighIn] = []
    var showPlateauAlert: Bool = false
    
    // Computed
    var calorieProgress: Double { Double(todaysCalories) / Double(activeProfile?.dailyCalorieTarget ?? 2000) }
    var progressColor: Color { ... }
    var remainingCalories: Int { (activeProfile?.dailyCalorieTarget ?? 2000) - todaysCalories }
    
    func loadToday(context: ModelContext) { ... }
    func checkForPlateau() { ... }
    func switchUser(to profile: UserProfile) { ... }
}
```

**Profile Switcher:** A persistent header control showing the active user's name/initials avatar. Tapping reveals the second profile (if it exists). Profile state stored in `@AppStorage("activeUserId")`.

**Plateau Alert:** When `NutritionCalculator.isOnPlateau(weighIns:)` returns true, present options via `.sheet(item: $plateauContext)` (enum or struct conforming to `Identifiable`):
1. Diet Break — sets a temporary 14-day maintenance mode (target = TDEE, no deficit)
2. Small Reduction — reduces daily target by 60 kcal and recalculates
3. Dismiss — snooze for 2 weeks

**Test requirements:**
- `testDashboardCalcToday()` — given 3 MealEntry objects, totals aggregate correctly
- `testProgressColor()` — color logic boundary conditions
- `testRemaining()` — negative remaining shows correctly (overages)

**Acceptance criteria:**
- Dashboard renders with real data from onboarding-created profile
- Calorie ring animates on load
- Profile switcher functional with 2 users
- FAB navigates to MealScannerView (stub OK in this PR)
- Plateau alert fires when detected

***

### PR 4: Meal Scanner — Gemini Integration

**Goal:** The primary value-add feature. Camera → Gemini → nutritional breakdown → log. This is the most complex PR.

**Flow:**
```
MealScannerView
├── Camera capture (PhotosUI: PHPickerViewController or camera sheet)
├── Image preview with "Add description (optional)" text field
├── "Analyze" button → fires GeminiService.analyzeMeal()
├── Loading state: spinner + "Analyzing your meal..." message
├── Results: MealAnalysisResultView
└── Error states: network error, low confidence, parse failure
```

**MealAnalysisResultView:**
```
[Meal thumbnail — small, top]
[Total Calories — large, centered]
[Macro split bar — protein/carbs/fat visual]
[FoodItemList]
  ├── Each item: name, weight, calories, macro mini-bar
  ├── Flagged items: amber warning icon, "Adjust?" prompt
  └── Tap item → inline edit sheet (adjust weight → recalculates macros)
[EstimationNotesAccordion — expandable, shows Gemini's reasoning]
[ConfidenceIndicator — "High / Medium / Low confidence" badge]
[MealTypeSelector — breakfast/lunch/dinner/snack, auto-selected]
[Log This Meal button → saves MealEntry to SwiftData + HealthKit]
[Re-analyze button — retakes or re-uploads photo]
[Discard button]
```

**ViewModel: `MealScannerViewModel`**
```swift
@MainActor
@Observable
class MealScannerViewModel {
    var selectedImage: UIImage?
    var textDescription: String = ""
    var analysisResult: MealAnalysisResponse?
    var editableItems: [EditableFoodItem] = []
    var mealType: MealType = .suggested(for: Date())
    var isAnalyzing: Bool = false
    var error: Error?
    var overallConfidence: Double = 0
    
    // Computed from editableItems
    var totalCalories: Int { editableItems.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { editableItems.reduce(0) { $0 + $1.proteinG } }
    // ... etc
    
    func analyze(geminiService: GeminiService) async { ... }
    func adjustItem(_ item: EditableFoodItem, newWeightG: Double) { ... }
    func logMeal(context: ModelContext, healthKitService: HealthKitService) async throws { ... }
}

struct EditableFoodItem: Identifiable {
    let id: UUID
    var name: String
    var weightG: Double
    var calories: Int       // recalculated from weight ratio when adjusted
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fiberG: Double
    var confidence: Double
    var isFlagged: Bool
    
    // When weight changes, scale all macros proportionally
    mutating func updateWeight(to newWeightG: Double) {
        guard weightG > 0 else { return }
        let ratio = newWeightG / weightG
        calories = Int(Double(calories) * ratio)
        proteinG *= ratio
        carbsG *= ratio
        fatG *= ratio
        fiberG *= ratio
        weightG = newWeightG
    }
}
```

**Error Handling:**
- No internet → "Offline mode: manual entry only" with direct text entry fallback
- Gemini API error → retry button + "Enter manually" fallback
- All items flagged (confidence < 0.60) → warning banner + "Review all items before logging"
- Image too dark / unrecognizable → specific guidance message

**Manual Entry Fallback (`ManualMealEntryView`):**
- Simple form: item name (text), calories (number), protein/carbs/fat/fiber (optional numbers)
- "Add another item" repeating form
- Same log flow as Gemini result

**Test requirements:**
- `testEditableFoodItemScaling()` — adjusting weight to 2× doubles all macros proportionally
- `testOverallConfidence()` — average of item confidences
- `testMealEntryCreation()` — GeminiService response → MealEntry model correctly
- Mock GeminiService for unit tests (protocol-based injection)

**Acceptance criteria:**
- Camera and photo library both work
- Gemini call fires, result displayed within 5 seconds on WiFi
- Manual item adjustment recalculates totals in real-time
- "Log This Meal" persists to SwiftData and writes to HealthKit
- Error states all render with recovery options
- Discard does not save anything

***

### PR 5: Meal Detail, Edit & Daily Log

**Goal:** Allow viewing, editing, and deleting previously logged meals. Complete the daily log experience.

**MealDetailView:**
- Full-screen view of a logged meal
- Shows photo (if available), all food items, macros, timestamp
- Edit button → re-opens MealScannerViewModel in edit mode (pre-populated)
- Delete meal → confirmation alert → removes from SwiftData + writes reversal to HealthKit
- Share button → generates a summary card image (using ImageRenderer)

**MealListView (within Dashboard, expanded):**
- Grouped sections by meal type (Breakfast, Lunch, Dinner, Snacks)
- Empty state per section with "Add [MealType]" placeholder
- Swipe-to-delete gesture
- Context menu on long press: View, Edit, Delete

**Daily Summary Footer (on Dashboard):**
- Fiber: shows "14g / 25g" with color coding (fiber is chronically low for most users)
- Net calories: consumed - target with +/- indicator
- Macro split: actual percentage vs. target percentage (text, not visual — keeps it compact)

**Test requirements:**
- `testMealDeletion()` — meal removed from SwiftData, daily totals update
- `testMealEdit()` — modifying a meal item updates all aggregates correctly

**Acceptance criteria:**
- All CRUD operations on meals work end-to-end
- Dashboard totals update immediately after edit/delete via `@Observable` view model refresh or SwiftData `@Query` invalidation
- HealthKit writes fire on log and reversal fires on delete

***

### PR 6: Weight Logging & Weigh-In Flow

**Goal:** Weekly weigh-in UX, dynamic TDEE recalculation, and weight chart.

**WeighInView** — presented via `.sheet(item: $weighInDraft)` from Dashboard or weekly reminder deep link:
```
[Large number input — weight in user's preferred unit]
[Unit toggle: lbs / kg]
[Date selector (defaults to today)]
[New TDEE preview — shows recalculated TDEE and new daily target]
  └── "Your target adjusts from {old} to {new} kcal/day"
[Save button]
[Skip — "Remind me tomorrow"]
```

**On save:**
1. Create `WeighIn` model with `weightKg`, `date`, `calculatedTDEE`, `adjustedDailyTarget`
2. Recalculate `UserProfile.dailyCalorieTarget` using new weight
3. Recalculate `UserProfile.tdee`
4. Update `UserProfile.updatedAt`
5. Write to HealthKit (body mass)
6. Check plateau condition → trigger alert if detected

**WeightProgressView:**
```
[Header: Current Weight | Start Weight | Goal Weight]
[Progress bar: start → current → goal]
[Weight Chart — line chart using Swift Charts]
  ├── X-axis: dates
  ├── Y-axis: weight (lbs or kg)
  ├── Plotted: actual weigh-ins
  ├── Dashed line: projected trajectory (from NutritionCalculator.weightProjection)
  └── Horizontal goal line
[Stats grid]
  ├── Lost so far: X lbs
  ├── To goal: Y lbs
  ├── Rate: ~Z lbs/week (last 4 weigh-ins)
  └── Projected goal date (dynamic)
[Weigh-in history list — all weigh-ins, most recent first]
```

**Weekly Reminder Notification:**
- UNUserNotificationCenter local notification
- Fires weekly on user-chosen day and time (set in Settings)
- Content: "Time for your weekly weigh-in, {name}. Tap to log."

**Test requirements:**
- `testWeighInRecalculation()` — new weight → new TDEE → new target all update correctly
- `testProjectedGoalDate()` — given current rate, projected date is sensible
- `testPlateauTriggeredOnSave()` — 3 identical weigh-ins trigger plateau

**Acceptance criteria:**
- Weigh-in persists and immediately updates dashboard TDEE/target
- Weight chart renders with projected line using Swift Charts
- Notification permission requested, weekly reminder schedules correctly
- HealthKit body mass write confirmed

***

### PR 7: Analytics & Insights Screen

**Goal:** Aggregated dietary habit reporting over user-selected timeframes.

**AnalyticsView layout:**
```
[Timeframe Picker: 7D | 30D | 90D | Custom]
[User Switcher tab (if 2 profiles)]

[Section: Calorie Adherence]
  ├── Bar chart: daily calories vs. target line (Swift Charts)
  ├── Average intake vs. target (text stats)
  └── % days on target (within ±10% band)

[Section: Macro Trends]
  ├── Stacked bar chart: protein/carbs/fat by day
  └── Average macro split pie/ring vs. target

[Section: Fiber & Micronutrients]
  ├── Fiber daily bar chart
  └── Days meeting 25g minimum

[Section: Patterns]
  ├── Calories by day of week (weekend vs. weekday comparison)
  ├── Calories by time of day (morning/midday/evening/night breakdown)
  └── Top 5 most-logged foods (list)

[Section: Weight Progress]
  └── (Reuses WeightProgressView as a sub-component)

[Insights Card — AI-generated summary]
  └── Single paragraph from Gemini summarizing patterns
      (generated on demand, not automatically)
```

**InsightsViewModel:**
```swift
@MainActor
@Observable
class AnalyticsViewModel {
    var selectedRange: DateRange = .days(7)
    var meals: [MealEntry] = []
    var weighIns: [WeighIn] = []
    var activeProfile: UserProfile?
    var aiInsightText: String?
    var isGeneratingInsight: Bool = false
    
    // Computed aggregates
    var averageDailyCalories: Double { ... }
    var adherencePct: Double { ... }         // % days within ±10% of target
    var averageMacroSplit: MacroSplit { ... }
    var dayOfWeekBreakdown: [DayOfWeek: Double] { ... }
    var topFoods: [(name: String, count: Int, avgCalories: Int)] { ... }
    
    func loadData(context: ModelContext) { ... }
    func generateInsight(geminiService: GeminiService) async { ... }
}
```

**Gemini Insight Generation:**
Build a summary prompt from aggregated stats (no raw food data sent — only aggregates for privacy), ask Gemini to produce a 2–3 sentence actionable insight. Example output: "Your weekend calorie intake averages 340 calories more than weekdays. Fiber is consistently below target — consider adding a daily serving of legumes or oats. Protein is well within the optimal range for muscle preservation at 24% of daily intake."

**Test requirements:**
- `testAdherenceCalculation()` — given 7 days of varied intake, calculates correct %
- `testDayOfWeekBreakdown()` — aggregation groups by weekday correctly
- `testTopFoodsAggregation()` — returns top 5 sorted by frequency

**Acceptance criteria:**
- All charts render with real SwiftData data
- Timeframe picker refreshes all charts correctly
- Gemini insight generates in < 5 seconds on demand
- Graceful empty state when < 3 days of data

***

### PR 8: Settings Screen

**Goal:** User profile management, API keys, preferences, and data utilities.

**SettingsView sections:**

**Profile**
- Edit name, height, date of birth, sex
- Update current weight (triggers recalculation)
- Edit activity level (triggers recalculation)
- Edit goal weight and target date
- Shows current TDEE and daily target with "Recalculate" button
- Macro target customization (sliders for protein/carbs/fat %, with validation that sums to 100%)
- Minimum calorie floor display (read-only, for transparency)

**Second User**
- Add partner profile (same onboarding flow, abbreviated)
- Remove partner profile (with data deletion confirmation)

**API Keys**
- Gemini API key — masked display, edit button, test button
- USDA API key — optional, with link to get free key

**Health & Integrations**
- HealthKit sync toggle (enable/disable writes)
- HealthKit sync toggle (enable/disable weight reads)
- "Sync now" manual trigger

**Notifications**
- Weekly weigh-in reminder — day of week picker, time picker
- Daily log reminder — optional, time picker

**Units**
- Weight: lbs / kg
- Height: ft/in / cm

**Data**
- Export all data as CSV (generates file with MealEntry + WeighIn data, shares via UIActivityViewController)
- Delete all my data (confirmation alert → wipes SwiftData for active user)
- Delete all data for both users

**About**
- App version
- Science sources acknowledgment (links to NIH/USDA references)

**Test requirements:**
- `testMacroSliderValidation()` — three sliders sum constrained to 100%
- `testRecalculationOnProfileEdit()` — changing height/weight updates TDEE/target
- `testCSVExport()` — export produces valid CSV with correct column headers

**Acceptance criteria:**
- All profile edits persist and propagate to dashboard
- API key changes take effect immediately (no restart required)
- CSV export generates correctly and shares
- Data deletion wipes only the targeted user's records

***

### PR 9: Design System Polish & App-Wide UX

**Goal:** Consistent visual language, animations, dark mode, accessibility, and the final production-quality UI pass.

**Design Tokens (`DesignSystem/`):**

```swift
// Colors.swift
extension Color {
    static let csPrimary = Color("Primary")         // Warm green — health/vitality
    static let csSecondary = Color("Secondary")     // Deep teal
    static let csAccent = Color("Accent")           // Amber — for warnings/flags
    static let csBackground = Color("Background")   // System adaptive
    static let csSurface = Color("Surface")         // Card background
    static let csSuccess = Color("Success")         // On-target
    static let csWarning = Color("Warning")         // Near limit
    static let csDanger = Color("Danger")           // Over limit
    
    static func calorieProgress(_ ratio: Double) -> Color {
        switch ratio {
        case ..<0.90: return .csSuccess
        case 0.90..<1.10: return .csWarning
        default: return .csDanger
        }
    }
}

// Typography.swift
extension Font {
    static let csLargeCalorie = Font.system(size: 52, weight: .bold, design: .rounded)
    static let csCardTitle = Font.system(size: 18, weight: .semibold)
    static let csBody = Font.system(.body)
    static let csCaption = Font.system(.caption)
    static let csMacroLabel = Font.system(size: 13, weight: .medium)
}
```

**Reusable Components:**
- `CalorieRingView(consumed:target:)` — animated circular progress
- `MacroBarView(protein:carbs:fat:targets:)` — horizontal segmented bar
- `FoodItemRowView(item:onAdjust:)` — meal item row with confidence badge
- `ConfidenceBadge(confidence:)` — color-coded pill
- `NutrientStatRow(label:value:unit:target:)` — consistent stat display
- `SectionCard` — styled container view modifier
- `EmptyStateView(icon:title:message:action:)` — consistent empty states

**Animation standards:**
- Calorie ring: spring animation on load and on value change
- Meal scan result: items appear with staggered delay (0.05s each)
- Progress charts: animate on first appear
- Sheet presentations: use `.sheet` (not full-screen cover) unless camera

**Accessibility:**
- All interactive elements have `.accessibilityLabel` and `.accessibilityHint`
- Calorie ring has `.accessibilityValue` reading remaining calories
- Dynamic type supported (prefer system text styles; use `.font(.body.scaled(by:))` for custom scaling)
- Icon-only buttons use `Button("Label", systemImage:)` with `.labelStyle(.iconOnly)` where needed
- Respect `.accessibilityDifferentiateWithoutColor` — do not rely on color alone for status
- Replace decorative motion with opacity when Reduce Motion is enabled
- No `onTapGesture` for primary actions — use `Button`
- VoiceOver order set on Dashboard

**Dark Mode:**
- All colors defined in Assets.xcassets with light/dark variants
- No hardcoded `Color(.white)` or `Color(.black)`

**App Icon & Launch Screen:**
- App icon: simple plate + fork silhouette with green accent
- Launch screen: wordmark "CalSnap" centered, system background (no artwork — fast load)

**Test requirements:**
- `testCalorieRingAccessibilityValue()` — accessibility value matches remaining string
- UI snapshot tests for Dashboard (light and dark mode)

**Acceptance criteria:**
- App passes light/dark mode inspection (no broken colors)
- Dynamic type Large → XL → XXXL does not break any layout
- All empty states have clear copy and an action
- App icon set complete (all required sizes)

***

### PR 10: Notifications, Widgets & App Polish

**Goal:** Finish production features — home screen widget, local notifications, and final QA sweep.

**Notification System:** See PR6 `NotificationManager` (`@MainActor class` conforming to `UNUserNotificationCenterDelegate`) — schedule/cancel/snooze by `userId`, `pendingWeighInSheet` for cold launch, injected via `AppContainer`. PR10 extends for daily reminders and widgets; do not reintroduce a singleton `shared` instance.

**Home Screen Widget (WidgetKit — separate target `CalSnapWidget`):**
- Small widget: Calorie ring with remaining calories number
- Medium widget: Calorie ring + today's macro bars
- Data sourced via AppGroup shared UserDefaults (`group.com.calsnap.shared`)
- Dashboard writes to AppGroup on every meal log
- Widget refreshes via `WidgetCenter.shared.reloadAllTimelines()` after each meal log

**AppGroup setup:**
```swift
// Both app and widget target use:
let sharedDefaults = UserDefaults(suiteName: "group.com.calsnap.shared")!

struct WidgetData: Codable {
    let activeUserName: String
    let targetCalories: Int
    let consumedCalories: Int
    let proteinConsumedG: Double
    let carbsConsumedG: Double
    let fatConsumedG: Double
    let updatedAt: Date
}
```

**Siri Shortcuts (App Intents):**
```swift
// AppIntents/LogMealIntent.swift
struct OpenScannerIntent: AppIntent {
    static var title: LocalizedStringResource = "Log a Meal"
    static var description = IntentDescription("Open CalSnap meal scanner")
    
    func perform() async throws -> some IntentResult {
        return .result()
    }
}
```

Register in `Info.plist` as `NSUserActivityTypes`.

**Final QA Checklist (acceptance criteria for PR 10):**
- App launches cold in < 1.5 seconds on iPhone 14
- No memory leaks in Instruments (Leaks template)
- Profile dashboard scroll on Release build, real device (SwiftUI Instruments template)
- No `DateFormatter`/`NumberFormatter` allocation in view `body`
- Meal list and weigh-in history use `List` or `LazyVStack` with stable `Identifiable` IDs
- No filter/sort inside `ForEach` initializers
- Gemini call cancels cleanly if user navigates away mid-scan
- All sheets dismiss correctly on swipe-down
- Keyboard avoidance works on all form inputs
- No hardcoded strings (all user-facing copy in `Localizable.xcstrings` with manual symbol keys — English only for v1)
- Privacy manifest (`PrivacyInfo.xcprivacy`) complete: declares HealthKit, camera, photo library, network access
- App Store privacy nutrition labels can be filled out accurately

***

## Info.plist Required Keys

```xml
<key>NSCameraUsageDescription</key>
<string>CalSnap uses your camera to photograph meals for nutritional analysis.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>CalSnap can analyze meal photos from your photo library.</string>

<key>NSHealthShareUsageDescription</key>
<string>CalSnap reads your body weight to improve calorie target accuracy.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>CalSnap logs your meals and weight to Apple Health.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>CalSnap sends weekly weigh-in reminders to keep you on track.</string>
```

***

## PR Dependency Map

```
PR 1: Scaffold & Core Infrastructure
  └── PR 2: Onboarding & User Profile
        └── PR 3: Dashboard
              ├── PR 4: Meal Scanner (Gemini)
              │     └── PR 5: Meal Detail & Daily Log
              └── PR 6: Weight Logging & Charts
                    └── PR 7: Analytics & Insights
                          └── PR 8: Settings
                                └── PR 9: Design System Polish
                                      └── PR 10: Notifications, Widgets & Polish
```

All PRs depend linearly. PRs 4, 5, and 6 can be parallelized after PR 3.

***

## Testing Strategy

| Layer | Tool | Coverage Target |
|---|---|---|
| Business logic (NutritionCalculator, ViewModels) | XCTest unit tests | 90%+ |
| Service layer (GeminiService, HealthKitService) | XCTest with protocol mocks | 80%+ |
| Repository layer | XCTest with in-memory SwiftData container | 80%+ |
| UI flows | XCUITest — happy path per screen | Key flows only |
| Snapshot tests | swift-snapshot-testing (optional SPM dep) | Dashboard light/dark |

**Mock pattern for GeminiService:**
```swift
protocol MealAnalyzerProtocol {
    func analyzeMeal(_ request: MealAnalysisRequest) async throws -> MealAnalysisResponse
}
extension GeminiService: MealAnalyzerProtocol {}
class MockMealAnalyzer: MealAnalyzerProtocol {
    var mockResponse: MealAnalysisResponse?
    var shouldThrow: Bool = false
    func analyzeMeal(_ request: MealAnalysisRequest) async throws -> MealAnalysisResponse {
        if shouldThrow { throw GeminiError.emptyResponse }
        return mockResponse ?? .testDefault
    }
}
```

***

## Environment & Secrets Management

- Gemini API key: Keychain only — never in source code, never in `Info.plist`
- USDA API key: Keychain (or environment variable for CI)
- No `.env` files committed to repo
- Add `*.xcconfig` to `.gitignore` if using xcconfig for build-time variables
- For CI (if added later): use GitHub Actions secrets → injected as environment variables at build time

***

## Cursor-Specific Instructions

1. **New files** — declare imports first; add a brief file comment only when purpose is non-obvious
2. **Never use `@StateObject`, `ObservableObject`, `@Published`, or `@EnvironmentObject`** — use `@State` with `@MainActor @Observable`
3. **All `@Observable` view models, routers, and UI-facing services** must be `@MainActor`
4. **SwiftData queries** use `@Query` macro in views and `ModelContext` in ViewModels passed via environment
5. **Navigation** — `NavigationStack(path:)` with `Hashable` route enums and `.navigationDestination(for:)`; prefer `.sheet(item:)` for model-driven sheets
6. **All async calls** use structured concurrency (`async/await`) — no completion handlers except legacy HealthKit APIs wrapped in continuations
7. **Never use Grand Central Dispatch** — use `Task`, actors, and `async`/`await`; prefer `Task.sleep(for:)` over `Task.sleep(nanoseconds:)`
8. **Formatting** — use `FormatStyle` / `Text(_, format:)` for user-visible dates, numbers, and measurements
9. **Data loading** — prefer `task {}` over `onAppear {}` for async work
10. **Error handling** — service throws → ViewModel catches → sets `var error: Error?` → view shows `ErrorBanner`; use typed throws where the error domain is singular
11. **SwiftUI previews** required for all view files using `#Preview` macro with mock data
12. **Gemini calls** are always gated by a non-nil API key check from Keychain before firing
13. **Unit conversion** (lbs ↔ kg, ft/in ↔ cm) is handled exclusively in display formatters — all internal storage is metric (kg, cm)
14. **HealthKit writes** are fire-and-forget (`Task { try? await ... }`) — they must never block the UI or surface errors to users (log only)
15. **Apply agent skills** (`.agents/skills/swiftui-*`, `swift-language`) for API choice, navigation, performance, and accessibility