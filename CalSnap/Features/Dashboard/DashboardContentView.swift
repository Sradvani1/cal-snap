import SwiftData
import SwiftUI

struct DashboardContentView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext

    @Bindable var viewModel: DashboardViewModel
    @Binding var navigationPath: [DashboardRoute]
    @Binding var weighInSheetContext: WeighInSheetContext?

    let weightProgressReloadTrigger: Int
    let mealDetailReloadToken: Int
    let onReload: () -> Void
    let onDeleteMeal: (MealEntry) -> Void
    let onWeighInSheetDismissed: () -> Void
    let onWeighInSaved: () -> Void

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack(alignment: .bottomTrailing) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(viewModel.greeting)
                                .font(.title2.bold())
                            Text(viewModel.formattedDate)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .accessibilitySortPriority(100)

                        if let error = viewModel.loadError {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(Color.csDanger)
                        }

                        CalorieRingCard(
                            consumed: viewModel.todaysCalories,
                            target: viewModel.activeProfile?.dailyCalorieTarget ?? 2000,
                            remaining: viewModel.remainingCalories,
                            progress: viewModel.calorieProgress,
                            progressBand: viewModel.calorieProgressBand
                        )
                        .accessibilitySortPriority(90)

                        MacroBarCard(
                            proteinConsumed: viewModel.todaysProteinG,
                            proteinTarget: viewModel.macroTargets.proteinG,
                            carbsConsumed: viewModel.todaysCarbsG,
                            carbsTarget: viewModel.macroTargets.carbsG,
                            fatConsumed: viewModel.todaysFatG,
                            fatTarget: viewModel.macroTargets.fatG,
                            fiberConsumed: viewModel.todaysFiberG,
                            fiberTarget: viewModel.fiberTargetG,
                            fiberProgressBand: viewModel.fiberProgressBand
                        )
                        .accessibilitySortPriority(80)

                        MealListView(
                            mealsByType: viewModel.mealsByType,
                            onSelect: { mealId in
                                navigationPath.append(.mealDetail(mealId))
                            },
                            onEdit: { mealId in
                                navigationPath.append(.mealScanner(.edit(mealId)))
                            },
                            onDelete: onDeleteMeal,
                            onAdd: { mealType in
                                navigationPath.append(.mealScanner(.create(initialMealType: mealType)))
                            }
                        )
                        .accessibilitySortPriority(70)

                        DailySummaryFooterView(
                            fiberConsumedG: viewModel.todaysFiberG,
                            fiberTargetG: viewModel.fiberTargetG,
                            fiberProgressBand: viewModel.fiberProgressBand,
                            netCalorieSummary: viewModel.netCalorieSummary,
                            netCalorieDelta: viewModel.netCalorieDelta,
                            actualMacroPercents: viewModel.actualMacroPercents,
                            targetMacroPercents: viewModel.targetMacroPercents
                        )

                        WeightTrendMiniChart(
                            weighIns: viewModel.chartWeighIns,
                            startingWeightKg: viewModel.activeProfile?.startingWeightKg ?? 0,
                            useLbs: viewModel.useLbsForDisplay,
                            onTap: {
                                navigationPath.append(.weightProgress)
                            },
                            onLogWeighIn: {
                                presentWeighInSheet()
                            }
                        )
                        .accessibilitySortPriority(60)
                    }
                    .padding()
                    .padding(.bottom, 72)
                }

                Button("Add meal", systemImage: "plus") {
                    navigationPath.append(.mealScanner(.create(initialMealType: nil)))
                }
                .labelStyle(.iconOnly)
                .font(.title2.bold())
                .foregroundStyle(Color.csOnPrimary)
                .frame(width: 56, height: 56)
                .background(Color.csPrimary)
                .clipShape(Circle())
                .shadow(radius: 4, y: 2)
                .padding()
                .accessibilitySortPriority(50)
                .accessibilityHint("Opens meal scanner to log a meal")
            }
            .navigationDestination(for: DashboardRoute.self) { route in
                switch route {
                case .mealDetail(let mealId):
                    MealDetailView(
                        mealId: mealId,
                        mealDetailReloadToken: mealDetailReloadToken,
                        onMealChanged: onReload,
                        navigationPath: $navigationPath
                    )
                case .mealScanner(let scannerRoute):
                    if let userId = viewModel.activeProfile?.id {
                        MealScannerView(
                            userId: userId,
                            route: scannerRoute,
                            onMealSaved: onReload
                        )
                    } else {
                        ContentUnavailableView("No profile", systemImage: "person.crop.circle")
                    }
                case .weightProgress:
                    if let profile = viewModel.activeProfile {
                        WeightProgressView(
                            viewModel: WeightProgressViewModel(
                                profile: profile,
                                useLbs: viewModel.useLbsForDisplay,
                                weighInRepository: appContainer.weighInRepository
                            ),
                            onLogWeighIn: presentWeighInSheet,
                            reloadTrigger: weightProgressReloadTrigger
                        )
                    } else {
                        ContentUnavailableView("No profile", systemImage: "person.crop.circle")
                    }
                }
            }
            .sheet(isPresented: Bindable(viewModel).showPlateauAlert) {
                PlateauAlertSheet(
                    onDietBreak: {
                        viewModel.applyDietBreak(context: modelContext)
                    },
                    onSmallReduction: {
                        viewModel.applySmallReduction(context: modelContext)
                    },
                    onDismiss: {
                        viewModel.dismissPlateauAlert()
                    }
                )
            }
            .sheet(item: $weighInSheetContext) { context in
                WeighInView(
                    viewModel: WeighInViewModel(
                        profile: context.profile,
                        currentWeightKg: context.currentWeightKg,
                        useLbs: context.useLbs,
                        weighInRepository: appContainer.weighInRepository,
                        healthKitService: appContainer.healthKitService
                    ),
                    notificationManager: appContainer.notificationManager,
                    onSaved: { _ in
                        onReload()
                        onWeighInSaved()
                        onWeighInSheetDismissed()
                    },
                    onSkipped: onWeighInSheetDismissed
                )
            }
        }
    }

    private func presentWeighInSheet() {
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
}

#Preview {
    @Previewable @State var path: [DashboardRoute] = []
    @Previewable @State var sheetContext: WeighInSheetContext?

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

    let viewModel = DashboardViewModel(
        userProfileRepository: UserProfileRepository(),
        mealRepository: MealRepository(),
        weighInRepository: WeighInRepository()
    )
    viewModel.activeProfile = profile

    return DashboardContentView(
        viewModel: viewModel,
        navigationPath: $path,
        weighInSheetContext: $sheetContext,
        weightProgressReloadTrigger: 0,
        mealDetailReloadToken: 0,
        onReload: {},
        onDeleteMeal: { _ in },
        onWeighInSheetDismissed: {},
        onWeighInSaved: {}
    )
    .environment(AppContainer())
    .modelContainer(container)
}
