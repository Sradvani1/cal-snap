import Foundation

struct WeighInSheetContext: Identifiable {
    let id: UUID
    let profile: UserProfile
    let currentWeightKg: Double
    let useLbs: Bool
}
