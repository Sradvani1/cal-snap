import SwiftUI
import SwiftData

struct WeighInSheetContext: Identifiable {
    let id: UUID
    let profile: UserProfile
    let currentWeightKg: Double
    let useLbs: Bool
}

struct DashboardView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.activeUserId) private var activeUserId = ""
    @State private var viewModel: DashboardViewModel?
    @State private var navigationPath: [DashboardRoute] = []
    @State private var suppressActiveUserIdReload = false
    @State private var mealPendingDelete: MealEntry?
    @State private var showDeleteConfirmation = false
    @State private var weighInSheetContext: WeighInSheetContext?
    @State private var weightProgressReloadTrigger = 0
    @State private var didWireNotifications = false

    var body: some View {
        Group {
            if let viewModel {
                DashboardContentView(
                    viewModel: viewModel,
                    navigationPath: $navigationPath,
                    weighInSheetContext: $weighInSheetContext,
                    activeUserId: activeUserId,
                    weightProgressReloadTrigger: weightProgressReloadTrigger,
                    onProfileSwitch: { profile in
                        activeUserId = profile.id.uuidString
                    },
                    onReload: reloadDashboard,
                    onDeleteMeal: { meal in
                        mealPendingDelete = meal
                        showDeleteConfirmation = true
                    },
                    onWeighInSheetDismissed: {
                        weightProgressReloadTrigger += 1
                    }
                )
                .alert("Delete this meal?", isPresented: $showDeleteConfirmation) {
                    Button("Delete", role: .destructive) {
                        confirmDelete()
                    }
                    Button("Cancel", role: .cancel) {
                        mealPendingDelete = nil
                    }
                } message: {
                    Text("This removes the meal from your log and reverses the HealthKit entry.")
                }
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = DashboardViewModel(
                    userProfileRepository: appContainer.userProfileRepository,
                    mealRepository: appContainer.mealRepository,
                    weighInRepository: appContainer.weighInRepository
                )
            }
            reloadDashboard()
            scheduleReminderIfNeeded()
            wireNotificationsIfNeeded()
        }
        .onChange(of: activeUserId) { _, _ in
            guard !suppressActiveUserIdReload else {
                suppressActiveUserIdReload = false
                return
            }
            navigationPath = []
            reloadDashboard()
            scheduleReminderIfNeeded()
        }
        .onChange(of: navigationPath.count) { oldCount, newCount in
            if newCount < oldCount {
                reloadDashboard()
            }
        }
    }

    private func confirmDelete() {
        guard let meal = mealPendingDelete else { return }

        do {
            try MealDeletionService.delete(
                meal: meal,
                mealRepository: appContainer.mealRepository,
                healthKitService: appContainer.healthKitService,
                context: modelContext
            )
            mealPendingDelete = nil
            reloadDashboard()
        } catch {
            viewModel?.loadError = error.localizedDescription
            mealPendingDelete = nil
        }
    }

    private func wireNotificationsIfNeeded() {
        guard !didWireNotifications, let vm = viewModel else { return }
        didWireNotifications = true
        appContainer.notificationManager.onWeighInReminderTapped = {
            presentWeighInSheet(using: vm)
        }
        if appContainer.notificationManager.consumePendingWeighInSheet() {
            presentWeighInSheet(using: vm)
        }
    }

    private func presentWeighInSheet(using viewModel: DashboardViewModel) {
        guard let profile = viewModel.activeProfile else { return }
        let currentWeight = viewModel.latestWeighInKg ?? profile.startingWeightKg
        weighInSheetContext = WeighInSheetContext(
            id: profile.id,
            profile: profile,
            currentWeightKg: currentWeight,
            useLbs: viewModel.useLbsForDisplay
        )
    }

    private func reloadDashboard() {
        viewModel?.loadToday(context: modelContext, activeUserId: activeUserId)
        syncActiveUserIdIfNeeded()
    }

    private func scheduleReminderIfNeeded() {
        guard let profiles = viewModel?.profiles, !profiles.isEmpty else { return }
        Task {
            for profile in profiles {
                await appContainer.notificationManager.scheduleWeighInReminder(
                    userId: profile.id,
                    name: profile.name
                )
            }
        }
    }

    private func syncActiveUserIdIfNeeded() {
        guard activeUserId.isEmpty,
              let profileId = viewModel?.activeProfile?.id.uuidString else { return }
        suppressActiveUserIdReload = true
        activeUserId = profileId
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(
        for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
        configurations: config
    )
    let profile = UserProfile(
        name: "Alex",
        dailyCalorieTarget: 2000,
        tdee: 2350,
        deficitKcal: 350
    )
    container.mainContext.insert(profile)

    return DashboardView()
        .environment(AppContainer())
        .modelContainer(container)
}
