import SwiftUI
import SwiftData

struct AnalyticsView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.profileDataRevision) private var profileDataRevision = 0

    @State private var viewModel: AnalyticsViewModel?
    @State private var weightProgressViewModel: WeightProgressViewModel?
    @State private var timeframePreset: AnalyticsTimeframePreset = .days7
    @State private var presetBeforeCustom: AnalyticsTimeframePreset?
    @State private var selectedRange: AnalyticsDateRange = .days(7)
    @State private var showCustomRangeSheet = false
    @State private var customRangeStart = Calendar.current.date(byAdding: .day, value: -6, to: Date.now) ?? Date.now
    @State private var customRangeEnd = Date.now
    @State private var weightProgressReloadTrigger = 0
    @State private var weighInSheetContext: WeighInSheetContext?

    private var reloadToken: String {
        "\(selectedRange.displayLabel)-\(customRangeStart.timeIntervalSince1970)-\(customRangeEnd.timeIntervalSince1970)-\(profileDataRevision)"
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                if let viewModel {
                    AnalyticsTimeframePicker(
                        preset: $timeframePreset,
                        selectedRange: $selectedRange,
                        showCustomRangeSheet: $showCustomRangeSheet
                    )

                    if let error = viewModel.loadError {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    if viewModel.hasEnoughData {
                        CalorieAdherenceSectionView(
                            chartSeries: viewModel.chartDailySeries,
                            calorieTarget: viewModel.calorieTarget,
                            averageDailyCalories: viewModel.averageDailyCalories,
                            adherencePct: viewModel.adherencePct
                        )
                        MacroTrendsSectionView(
                            chartSeries: viewModel.chartDailySeries,
                            actualMacroSplit: viewModel.actualMacroSplit,
                            targetMacroSplit: viewModel.targetMacroSplit
                        )
                        FiberSectionView(
                            chartSeries: viewModel.chartDailySeries,
                            fiberTargetG: viewModel.fiberTargetG,
                            daysMeetingFiberTarget: viewModel.daysMeetingFiberTarget,
                            loggedDayCount: viewModel.loggedDayCount
                        )
                        PatternsSectionView(
                            dayOfWeekBreakdown: viewModel.dayOfWeekBreakdown,
                            timeOfDayBreakdown: viewModel.timeOfDayBreakdown,
                            weekendAverageCalories: viewModel.weekendAverageCalories,
                            weekdayAverageCalories: viewModel.weekdayAverageCalories,
                            topFoods: viewModel.topFoods
                        )
                        AnalyticsInsightCard(
                            hasEnoughData: viewModel.hasEnoughData,
                            isGenerating: viewModel.isGeneratingInsight,
                            insightText: viewModel.aiInsightText,
                            errorText: viewModel.insightError,
                            onGenerate: {
                                Task {
                                    await viewModel.generateInsight(geminiService: appContainer.geminiService)
                                }
                            }
                        )
                    } else {
                        AnalyticsSectionCard(title: "Not enough data") {
                            Text("Log at least 3 days of meals to see patterns and insights.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }

                    if let weightProgressViewModel {
                        AnalyticsSectionCard(title: "Weight Progress") {
                            WeightProgressView(
                                presentation: .embedded,
                                viewModel: weightProgressViewModel,
                                onLogWeighIn: presentWeighInSheet,
                                reloadTrigger: weightProgressReloadTrigger
                            )
                        }
                    }
                } else {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                }
            }
            .padding()
        }
        .navigationTitle("Analytics")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: reloadToken) {
            if viewModel == nil {
                viewModel = AnalyticsViewModel(
                    userProfileRepository: appContainer.userProfileRepository,
                    mealRepository: appContainer.mealRepository,
                    weighInRepository: appContainer.weighInRepository
                )
            }
            reloadAnalytics()
        }
        .onChange(of: timeframePreset) { oldValue, newValue in
            if newValue == .custom {
                presetBeforeCustom = oldValue
                showCustomRangeSheet = true
            } else {
                selectedRange = newValue.dateRange
                clearInsight()
            }
        }
        .onChange(of: selectedRange) { _, _ in
            clearInsight()
        }
        .onChange(of: profileDataRevision) { _, _ in
            reloadAnalytics(bumpWeightReload: true)
        }
        .sheet(isPresented: $showCustomRangeSheet, onDismiss: revertCustomPresetIfNeeded) {
            AnalyticsCustomRangeSheet(
                customStart: $customRangeStart,
                customEnd: $customRangeEnd,
                onApply: applyCustomRange
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
                    reloadAnalytics(bumpWeightReload: true)
                },
                onSkipped: {}
            )
        }
    }

    private func clearInsight() {
        viewModel?.aiInsightText = nil
        viewModel?.insightError = nil
    }

    private func revertCustomPresetIfNeeded() {
        guard case .custom = selectedRange else {
            if let presetBeforeCustom {
                timeframePreset = presetBeforeCustom
            }
            return
        }
        presetBeforeCustom = nil
    }

    private func reloadAnalytics(bumpWeightReload: Bool = false) {
        guard let viewModel else { return }
        viewModel.selectedRange = selectedRange
        viewModel.load(context: modelContext)
        refreshWeightProgressViewModel(bumpReload: bumpWeightReload)
    }

    private func refreshWeightProgressViewModel(bumpReload: Bool = false) {
        guard let profile = viewModel?.activeProfile else {
            weightProgressViewModel = nil
            return
        }

        let profileChanged = weightProgressViewModel?.profile.id != profile.id
        if weightProgressViewModel == nil || profileChanged {
            weightProgressViewModel = WeightProgressViewModel(
                profile: profile,
                useLbs: viewModel?.useLbsForDisplay ?? false,
                weighInRepository: appContainer.weighInRepository
            )
            weightProgressReloadTrigger += 1
        } else if bumpReload {
            weightProgressReloadTrigger += 1
        }
    }

    private func applyCustomRange(start: Date, end: Date) {
        let calendar = Calendar.current
        let normalizedStart = calendar.startOfDay(for: start)
        let normalizedEnd = calendar.startOfDay(for: end)
        let daySpan = calendar.dateComponents([.day], from: normalizedStart, to: normalizedEnd).day ?? 0
        let cappedEnd: Date
        if daySpan > AnalyticsDateRange.maxCustomSpanDays,
           let limitEnd = calendar.date(byAdding: .day, value: AnalyticsDateRange.maxCustomSpanDays, to: normalizedStart) {
            cappedEnd = min(normalizedEnd, limitEnd)
        } else {
            cappedEnd = normalizedEnd
        }
        customRangeStart = normalizedStart
        customRangeEnd = cappedEnd
        selectedRange = .custom(start: normalizedStart, end: cappedEnd)
        timeframePreset = .custom
        presetBeforeCustom = nil
    }

    private func presentWeighInSheet() {
        guard let viewModel, let profile = viewModel.activeProfile else { return }
        let currentWeight = (try? appContainer.weighInRepository.fetchLatestWeighIns(
            for: profile.id,
            count: 1,
            context: modelContext
        ).last?.weightKg) ?? profile.startingWeightKg

        weighInSheetContext = WeighInSheetContext(
            id: profile.id,
            profile: profile,
            currentWeightKg: currentWeight,
            useLbs: viewModel.useLbsForDisplay
        )
    }
}

#Preview {
    NavigationStack {
        AnalyticsView()
    }
    .environment(AppContainer())
    .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self], inMemory: true)
}
