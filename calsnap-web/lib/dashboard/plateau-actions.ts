import { copy } from '@/lib/copy';
import {
  applyDietBreakTargets,
  maintenanceModeEndDate,
  maintenanceModeKey,
  storeDate,
} from '@/lib/dashboard/plateau-state';
import type { UserProfile } from '@/lib/models/user-profile';
import type { CalorieTargetUpdate } from '@/lib/repositories/profile';

export type PlateauActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function executePlateauDietBreak(
  uid: string,
  profile: UserProfile,
  updateTargets: (uid: string, targets: CalorieTargetUpdate) => Promise<UserProfile>,
): Promise<PlateauActionResult> {
  const updated = applyDietBreakTargets(profile);
  try {
    await updateTargets(uid, {
      dailyCalorieTarget: updated.dailyCalorieTarget,
      deficitKcal: updated.deficitKcal,
    });
    storeDate(maintenanceModeKey(uid), maintenanceModeEndDate());
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: copy('dashboard.plateau.error.saveFailed'),
    };
  }
}
