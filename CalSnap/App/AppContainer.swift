import SwiftUI

@Observable
final class AppContainer {
    let healthKitService = HealthKitService()
    let geminiService = GeminiService()
    let userProfileRepository = UserProfileRepository()
}
