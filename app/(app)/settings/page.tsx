import { requireUser } from "@/lib/auth";
import { ProfileSection } from "@/components/settings/profile-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { AppsSection } from "@/components/settings/apps-section";
import { AboutSection } from "@/components/settings/about-section";

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
      <AppsSection />
      <AboutSection />
    </div>
  );
}
