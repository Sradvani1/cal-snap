import SwiftUI
import SwiftData

struct RootView: View {
    @Query(sort: \UserProfile.createdAt) private var profiles: [UserProfile]

    var body: some View {
        Group {
            if profiles.isEmpty {
                OnboardingView()
            } else {
                DashboardView()
            }
        }
    }
}

#Preview {
    RootView()
        .environment(AppContainer())
        .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self], inMemory: true)
}
