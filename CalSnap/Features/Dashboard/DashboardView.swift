import SwiftUI
import SwiftData

struct DashboardView: View {
    @Query(sort: \UserProfile.createdAt) private var profiles: [UserProfile]
    @AppStorage(AppStorageKey.activeUserId) private var activeUserId = ""

    private var activeProfile: UserProfile? {
        if let id = UUID(uuidString: activeUserId),
           let match = profiles.first(where: { $0.id == id }) {
            return match
        }
        return profiles.first
    }

    var body: some View {
        VStack(spacing: 16) {
            Text("CalSnap")
                .font(.largeTitle.bold())
            if let profile = activeProfile {
                Text("Welcome, \(profile.name)")
                    .font(.title2)
                Text("Daily target: \(profile.dailyCalorieTarget) kcal")
                    .foregroundStyle(.secondary)
            }
            Text("Dashboard coming in PR3")
                .foregroundStyle(.tertiary)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: UserProfile.self, inMemory: true)
}
