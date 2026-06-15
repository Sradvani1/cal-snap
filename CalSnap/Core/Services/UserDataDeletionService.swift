import Foundation
import SwiftData

enum UserDataDeletionService {
    @MainActor
    static func deleteUserData(
        userId: UUID,
        userProfileRepository: UserProfileRepository,
        notificationManager: NotificationManager,
        context: ModelContext
    ) throws {
        let profiles = try userProfileRepository.fetchAll(context: context)
        guard let profile = profiles.first(where: { $0.id == userId }) else { return }

        context.delete(profile)
        clearPerUserDefaults(userId: userId)
        notificationManager.cancelWeighInReminder(userId: userId)
        try context.save()
    }

    @MainActor
    static func deleteAllUserData(
        userProfileRepository: UserProfileRepository,
        notificationManager: NotificationManager,
        context: ModelContext
    ) throws {
        let profiles = try userProfileRepository.fetchAll(context: context)
        for profile in profiles {
            clearPerUserDefaults(userId: profile.id)
            notificationManager.cancelWeighInReminder(userId: profile.id)
            context.delete(profile)
        }
        try context.save()
    }

    private static func clearPerUserDefaults(userId: UUID) {
        let keys = [
            AppStorageKey.plateauSnoozeUntil(userId: userId),
            AppStorageKey.maintenanceModeUntil(userId: userId),
            AppStorageKey.weighInSnoozeUntil(userId: userId),
            AppStorageKey.weighInReminderWeekday(userId: userId),
            AppStorageKey.weighInReminderHour(userId: userId),
            AppStorageKey.weighInReminderMinute(userId: userId),
        ]
        for key in keys {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }
}
