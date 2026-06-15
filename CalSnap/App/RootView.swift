import SwiftUI
import SwiftData

enum AppTab: Hashable {
    case dashboard
    case analytics
    case settings
}

struct RootView: View {
    @Query(sort: \UserProfile.createdAt) private var profiles: [UserProfile]
    @State private var selectedTab: AppTab = .dashboard

    var body: some View {
        Group {
            if profiles.isEmpty {
                OnboardingView()
            } else {
                TabView(selection: $selectedTab) {
                    Tab("Dashboard", systemImage: "house.fill", value: .dashboard) {
                        DashboardView()
                    }
                    Tab("Analytics", systemImage: "chart.bar.fill", value: .analytics) {
                        NavigationStack {
                            AnalyticsView()
                        }
                    }
                    Tab("Settings", systemImage: "gearshape.fill", value: .settings) {
                        NavigationStack {
                            SettingsView()
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    RootView()
        .environment(AppContainer())
        .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self], inMemory: true)
}
