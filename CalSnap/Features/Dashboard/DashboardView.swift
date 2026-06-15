import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.profileDataRevision) private var profileDataRevision = 0
    @State private var viewModel: DashboardViewModel?
    @State private var navigationPath: [DashboardRoute] = []
    @State private var mealPendingDelete: MealEntry?
    @State private var showDeleteConfirmation = false
    @State private var weighInSheetContext: WeighInSheetContext?
    @State private var weightProgressReloadTrigger = 0
    @State private var mealDetailReloadToken = 0
    @State private var didWireNotifications = false

    var body: some View {
        Group {
            if let viewModel {
                DashboardContentView(
                    viewModel: viewModel,
                    navigationPath: $navigationPath,
                    weighInSheetContext: $weighInSheetContext,
                    weightProgressReloadTrigger: weightProgressReloadTrigger,
                    mealDetailReloadToken: mealDetailReloadToken,
                    onReload: reloadDashboard,
                    onDeleteMeal: { meal in
                        mealPendingDelete = meal
                        showDeleteConfirmation = true
                    },
                    onWeighInSheetDismissed: {
                        weightProgressReloadTrigger += 1
                    },
                    onWeighInSaved: scheduleReminderIfNeeded
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
        .onChange(of: navigationPath.count) { oldCount, newCount in
            if newCount < oldCount {
                reloadDashboard()
            }
        }
        .onChange(of: profileDataRevision) { _, _ in
            reloadDashboard()
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
        appContainer.notificationManager.onWeighInReminderTapped = { _ in
            presentWeighInSheet(using: vm)
        }
        if appContainer.notificationManager.consumePendingWeighInRequest() != nil {
            presentWeighInSheet(using: vm)
        }
    }

    private func presentWeighInSheet(using viewModel: DashboardViewModel) {
        guard let profile = viewModel.activeProfile else { return }

        let currentWeight = viewModel.latestWeighInKg(for: profile.id, context: modelContext)
            ?? profile.startingWeightKg
        weighInSheetContext = WeighInSheetContext(
            id: profile.id,
            profile: profile,
            currentWeightKg: currentWeight,
            useLbs: viewModel.useLbsForDisplay
        )
    }

    private func reloadDashboard() {
        viewModel?.loadToday(context: modelContext)
        mealDetailReloadToken += 1
    }

    private func scheduleReminderIfNeeded() {
        guard let profile = viewModel?.activeProfile else { return }
        Task {
            await appContainer.notificationManager.scheduleWeighInReminder(
                userId: profile.id,
                name: profile.name
            )
        }
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
