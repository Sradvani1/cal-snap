import Foundation

enum GeminiTestState: Equatable {
    case idle
    case testing
    case success
    case failure(String)
}
