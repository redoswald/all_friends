import { requireUser } from "@/lib/auth";
import { ProfileSection } from "@/components/settings/profile-section";
import { AppearanceSection } from "@/components/settings/appearance-section";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <h1 className="text-[2rem] font-semibold leading-tight">Settings</h1>

      <ProfileSection
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
      />

      <AppearanceSection />
    </div>
  );
}
