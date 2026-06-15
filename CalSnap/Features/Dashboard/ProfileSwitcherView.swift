import SwiftUI

struct ProfileSwitcherView: View {
    let profiles: [UserProfile]
    let activeProfile: UserProfile?
    let onSwitch: (UserProfile) -> Void

    var body: some View {
        if profiles.count > 1 {
            Menu {
                ForEach(profiles, id: \.id) { profile in
                    Button {
                        onSwitch(profile)
                    } label: {
                        if profile.id == activeProfile?.id {
                            Label(profile.name, systemImage: "checkmark")
                        } else {
                            Text(profile.name)
                        }
                    }
                }
            } label: {
                switcherLabel(showChevron: true)
            }
        } else if let profile = activeProfile ?? profiles.first {
            switcherLabel(for: profile, showChevron: false)
        }
    }

    @ViewBuilder
    private func switcherLabel(for profile: UserProfile? = nil, showChevron: Bool) {
        let displayProfile = profile ?? activeProfile ?? profiles.first
        HStack(spacing: 8) {
            if let displayProfile {
                Text(initials(for: displayProfile.name))
                    .font(.caption.bold())
                    .frame(width: 32, height: 32)
                    .background(Color.accentColor.opacity(0.2))
                    .clipShape(Circle())
                Text(displayProfile.name)
                    .font(.subheadline.weight(.semibold))
            }
            if showChevron {
                Image(systemName: "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func initials(for name: String) -> String {
        String(name.prefix(1)).uppercased()
    }
}

#Preview("Single profile") {
    ProfileSwitcherView(
        profiles: [UserProfile(name: "Alex")],
        activeProfile: UserProfile(name: "Alex"),
        onSwitch: { _ in }
    )
    .padding()
}

#Preview("Dual profile") {
    ProfileSwitcherView(
        profiles: [
            UserProfile(name: "Alex"),
            UserProfile(name: "Sam"),
        ],
        activeProfile: UserProfile(name: "Alex"),
        onSwitch: { _ in }
    )
    .padding()
}
