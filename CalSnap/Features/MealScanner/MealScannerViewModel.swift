import Foundation
import Network
import SwiftData
import UIKit

enum MealScannerPhase: Equatable {
    case capture
    case analyzing
    case results
    case error
    case manual
}

enum ScannerError: Equatable {
    case offline
    case missingAPIKey
    case api(String)
    case parse(String)
    case unrecognizable
}

enum MealScannerError: Error, Equatable {
    case mealNotFound
    case notInEditMode
}

private struct MealEditBaseline: Equatable {
    // Tracks meal type, description, macro totals, and items. Photo changes are not editable on the results screen.
    let mealType: MealType
    let textDescription: String
    let totalCalories: Int
    let totalProteinG: Double
    let totalCarbsG: Double
    let totalFatG: Double
    let totalFiberG: Double
    let items: [EditableFoodItem]
}

enum ConfidenceLevel: Equatable {
    case high
    case medium
    case low

    var label: String {
        switch self {
        case .high: return "High confidence"
        case .medium: return "Medium confidence"
        case .low: return "Low confidence"
        }
    }

    static func from(score: Double) -> ConfidenceLevel {
        switch score {
        case 0.8...: return .high
        case 0.6..<0.8: return .medium
        default: return .low
        }
    }
}

@Observable
@MainActor
final class MealScannerViewModel {
    var phase: MealScannerPhase = .capture
    var selectedImage: UIImage?
    private(set) var preparedPhoto: PreparedMealImage?
    var textDescription = ""
    var analysisResult: MealAnalysisResponse?
    var editableItems: [EditableFoodItem] = []
    var mealType: MealType = .suggested(for: Date.now)
    var scannerError: ScannerError?
    var estimationNotes: String?
    var isManualEntry = false
    var editingItemID: UUID?
    var isLogging = false
    var logError: String?

    private var editingMealId: UUID?
    private var editingTimestamp: Date?
    private var analyzeTask: Task<Void, Never>?
    private var originalItemWeights: [UUID: Double] = [:]
    private var editBaseline: MealEditBaseline?
    private let userId: UUID
    private let mealAnalyzer: any MealAnalyzerProtocol
    private let healthKitService: HealthKitService
    private let mealRepository: MealRepository

    init(
        userId: UUID,
        mealAnalyzer: any MealAnalyzerProtocol,
        healthKitService: HealthKitService,
        mealRepository: MealRepository
    ) {
        self.userId = userId
        self.mealAnalyzer = mealAnalyzer
        self.healthKitService = healthKitService
        self.mealRepository = mealRepository
    }

    var isAnalyzing: Bool { phase == .analyzing }

    var totalCalories: Int {
        editableItems.reduce(0) { $0 + $1.calories }
    }

    var totalProteinG: Double {
        editableItems.reduce(0) { $0 + $1.proteinG }
    }

    var totalCarbsG: Double {
        editableItems.reduce(0) { $0 + $1.carbsG }
    }

    var totalFatG: Double {
        editableItems.reduce(0) { $0 + $1.fatG }
    }

    var totalFiberG: Double {
        editableItems.reduce(0) { $0 + $1.fiberG }
    }

    var overallConfidence: Double {
        guard !isManualEntry else { return 0 }
        return Self.computeOverallConfidence(items: editableItems)
    }

    var confidenceLevel: ConfidenceLevel {
        switch overallConfidence {
        case 0.8...: return .high
        case 0.6..<0.8: return .medium
        default: return .low
        }
    }

    var showsConfidenceIndicator: Bool { !isManualEntry }

    var allItemsFlagged: Bool {
        !editableItems.isEmpty && editableItems.allSatisfy(\.isFlagged)
    }

    var canAnalyze: Bool {
        preparedPhoto != nil && !isAnalyzing && hasGeminiAPIKey
    }

    var hasGeminiAPIKey: Bool {
        (try? APIKeyResolver.resolvedGeminiAPIKey())?.isEmpty == false
    }

    var canLog: Bool {
        !editableItems.isEmpty && editableItems.allSatisfy {
            $0.weightG > 0 && !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    var hasAdjustedItems: Bool {
        if isManualEntry { return false }
        return editableItems.contains { item in
            guard let original = originalItemWeights[item.id] else { return false }
            return abs(item.weightG - original) > 0.01
        }
    }

    var isEditing: Bool {
        editingMealId != nil
    }

    var hasUnsavedWork: Bool {
        if isEditing {
            guard let editBaseline else { return false }
            return currentEditBaseline != editBaseline
        }
        switch phase {
        case .analyzing:
            return true
        case .results:
            return !editableItems.isEmpty
        case .manual:
            return editableItems.contains { item in
                !item.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || item.calories > 0
            }
        case .capture, .error:
            return preparedPhoto != nil
                || !textDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    static var isCameraAvailable: Bool {
        UIImagePickerController.isSourceTypeAvailable(.camera)
    }

    @discardableResult
    func setSelectedPhoto(from image: UIImage) -> Bool {
        do {
            let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(image)
            preparedPhoto = prepared
            selectedImage = UIImage(data: prepared.data)
            return selectedImage != nil
        } catch {
            preparedPhoto = nil
            selectedImage = nil
            return false
        }
    }

    func analyze() {
        analyzeTask?.cancel()
        scannerError = nil

        guard let preparedPhoto else { return }

        guard hasGeminiAPIKey else {
            scannerError = .missingAPIKey
            phase = .error
            return
        }

        let description = textDescription.trimmingCharacters(in: .whitespacesAndNewlines)
        let request = MealAnalysisRequest(
            imageData: preparedPhoto.data,
            mimeType: preparedPhoto.mimeType,
            textDescription: description.isEmpty ? nil : description
        )

        phase = .analyzing
        isManualEntry = false

        analyzeTask = Task { [weak self] in
            guard let self else { return }

            guard await Self.isNetworkAvailable() else {
                scannerError = .offline
                phase = .error
                return
            }

            do {
                let response = try await mealAnalyzer.analyzeMeal(request)
                guard !Task.isCancelled else { return }
                applyAnalysis(response)
            } catch let error as GeminiError {
                guard !Task.isCancelled else { return }
                handleGeminiError(error)
            } catch {
                guard !Task.isCancelled else { return }
                scannerError = .api(error.localizedDescription)
                phase = .error
            }
        }
    }

    func applyAnalysis(_ response: MealAnalysisResponse) {
        analysisResult = response
        let flaggedNames = Set(response.flaggedItems)
        editableItems = response.items.map {
            EditableFoodItem.from(result: $0, flaggedNames: flaggedNames)
        }
        originalItemWeights = Dictionary(
            uniqueKeysWithValues: editableItems.map { ($0.id, $0.weightG) }
        )
        estimationNotes = response.estimationNotes

        if editableItems.isEmpty {
            scannerError = .unrecognizable
            phase = .error
            return
        }

        scannerError = nil
        phase = .results
    }

    func adjustItem(id: UUID, newWeightG: Double) {
        guard let index = editableItems.firstIndex(where: { $0.id == id }) else { return }
        editableItems[index].updateWeight(to: newWeightG)
    }

    func enterManualEntry() {
        analyzeTask?.cancel()
        analysisResult = nil
        estimationNotes = nil
        scannerError = nil
        isManualEntry = true
        editableItems = [EditableFoodItem.emptyManual()]
        originalItemWeights = [:]
        phase = .manual
    }

    func addManualItem() {
        editableItems.append(EditableFoodItem.emptyManual())
    }

    func removeManualItem(id: UUID) {
        guard editableItems.count > 1 else { return }
        editableItems.removeAll { $0.id == id }
    }

    func finishManualEntry() {
        guard editableItems.allSatisfy({
            !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && $0.calories > 0
        }) else { return }

        for index in editableItems.indices {
            editableItems[index].confidence = 1.0
            editableItems[index].isFlagged = false
        }
        isManualEntry = true
        estimationNotes = nil
        phase = .results
    }

    func retryAnalyze() {
        scannerError = nil
        phase = .capture
        analyze()
    }

    func reAnalyze() {
        analyzeTask?.cancel()
        analysisResult = nil
        editableItems = []
        estimationNotes = nil
        scannerError = nil
        isManualEntry = false
        originalItemWeights = [:]
        phase = .capture
    }

    func discard() {
        cancelAnalysis()
        selectedImage = nil
        preparedPhoto = nil
        textDescription = ""
        analysisResult = nil
        editableItems = []
        estimationNotes = nil
        scannerError = nil
        isManualEntry = false
        editingItemID = nil
        editingMealId = nil
        editingTimestamp = nil
        editBaseline = nil
        originalItemWeights = [:]
        mealType = .suggested(for: Date.now)
        phase = .capture
    }

    func loadForEditing(meal: MealEntry) {
        cancelAnalysis()
        editingMealId = meal.id
        editingTimestamp = meal.timestamp
        mealType = meal.mealType
        textDescription = meal.textDescription ?? ""
        estimationNotes = meal.estimationNotes
        isManualEntry = meal.geminiConfidence == 0
        analysisResult = nil
        scannerError = nil

        if let photoData = meal.photoData {
            preparedPhoto = MealPhotoProcessor.preparedPreservingBytes(from: photoData)
            selectedImage = UIImage(data: photoData)
        } else {
            preparedPhoto = nil
            selectedImage = nil
        }

        editableItems = meal.items.map { EditableFoodItem.from(foodItem: $0) }
        originalItemWeights = Dictionary(
            uniqueKeysWithValues: editableItems.map { ($0.id, $0.weightG) }
        )
        editBaseline = currentEditBaseline
        phase = .results
    }

    func saveMeal(context: ModelContext) async throws {
        if isEditing {
            try await updateMeal(context: context)
        } else {
            try await logMeal(context: context)
        }
    }

    func logMeal(context: ModelContext) async throws {
        logError = nil
        let entry = makeMealEntry()
        try mealRepository.save(entry, context: context)

        let healthKit = healthKitService
        let snapshot = MealHealthSnapshot(meal: entry)
        if AppStorageKey.healthKitWritesEnabledValue {
            Task {
                do {
                    try await healthKit.logMeal(snapshot)
                } catch {
                    print("HealthKit meal log failed: \(error.localizedDescription)")
                }
            }
        }
    }

    func updateMeal(context: ModelContext) async throws {
        logError = nil
        guard let editingMealId else {
            throw MealScannerError.notInEditMode
        }
        guard let existing = try mealRepository.fetchMeal(id: editingMealId, context: context) else {
            throw MealScannerError.mealNotFound
        }

        let oldSnapshot = MealHealthSnapshot(meal: existing)
        let entry = makeMealEntry()
        let items = editableItems.map { $0.toFoodItem() }
        try mealRepository.update(entry, items: items, context: context)

        let healthKit = healthKitService
        let newSnapshot = MealHealthSnapshot(meal: entry)
        if AppStorageKey.healthKitWritesEnabledValue {
            Task {
                do {
                    try await healthKit.reverseMeal(oldSnapshot)
                    try await healthKit.logMeal(newSnapshot)
                } catch {
                    print("HealthKit meal update sync failed: \(error.localizedDescription)")
                }
            }
        }
    }

    func makeMealEntry() -> MealEntry {
        let description = textDescription.trimmingCharacters(in: .whitespacesAndNewlines)

        return MealEntry(
            id: editingMealId ?? UUID(),
            userId: userId,
            timestamp: editingTimestamp ?? Date.now,
            mealType: mealType,
            photoData: preparedPhoto?.data,
            textDescription: description.isEmpty ? nil : description,
            totalCalories: totalCalories,
            totalProteinG: totalProteinG,
            totalCarbsG: totalCarbsG,
            totalFatG: totalFatG,
            totalFiberG: totalFiberG,
            geminiConfidence: isManualEntry ? 0 : overallConfidence,
            isManuallyAdjusted: isManualEntry || hasAdjustedItems,
            estimationNotes: isManualEntry ? nil : estimationNotes,
            items: editableItems.map { $0.toFoodItem() }
        )
    }

    func cancelAnalysis() {
        analyzeTask?.cancel()
        analyzeTask = nil
        if phase == .analyzing {
            phase = .capture
        }
    }

    static func computeOverallConfidence(items: [EditableFoodItem]) -> Double {
        guard !items.isEmpty else { return 0 }
        let sum = items.reduce(0.0) { $0 + $1.confidence }
        return sum / Double(items.count)
    }

    private func handleGeminiError(_ error: GeminiError) {
        switch error {
        case .apiKeyMissing:
            scannerError = .missingAPIKey
        case .invalidJSON(let message):
            scannerError = .parse(message)
        case .emptyResponse:
            scannerError = .unrecognizable
        case .validationFailed:
            scannerError = .api(error.localizedDescription)
        case .requestFailed(let message):
            if message == "No internet connection." {
                scannerError = .offline
            } else {
                scannerError = .api(message)
            }
        }
        phase = .error
    }

    private static func isNetworkAvailable() async -> Bool {
        await withCheckedContinuation { continuation in
            let monitor = NWPathMonitor()
            let queue = DispatchQueue(label: "com.calsnap.network-check")
            let state = NetworkCheckState()

            let resume: @Sendable (Bool) -> Void = { value in
                guard state.tryResume() else { return }
                monitor.cancel()
                continuation.resume(returning: value)
            }

            monitor.pathUpdateHandler = { path in
                resume(path.status == .satisfied)
            }
            monitor.start(queue: queue)

            queue.asyncAfter(deadline: .now() + 2) {
                resume(true)
            }
        }
    }

    private var currentEditBaseline: MealEditBaseline {
        MealEditBaseline(
            mealType: mealType,
            textDescription: textDescription.trimmingCharacters(in: .whitespacesAndNewlines),
            totalCalories: totalCalories,
            totalProteinG: totalProteinG,
            totalCarbsG: totalCarbsG,
            totalFatG: totalFatG,
            totalFiberG: totalFiberG,
            items: editableItems
        )
    }
}

private final class NetworkCheckState: @unchecked Sendable {
    private let lock = NSLock()
    private var didResume = false

    func tryResume() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard !didResume else { return false }
        didResume = true
        return true
    }
}
