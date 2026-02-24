import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileSection } from "@/components/settings/profile-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { SecuritySection } from "@/components/settings/security-section";
import { AppsSection } from "@/components/settings/apps-section";
import { DataSection } from "@/components/settings/data-section";
import { AboutSection } from "@/components/settings/about-section";

export default async function SettingsPage() {
  const user = await requireUser();

  // Get Supabase user identities to determine connected providers
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  const providers = supabaseUser?.app_metadata?.providers ??
    supabaseUser?.identities?.map((i) => i.provider) ?? [];

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
      <SecuritySection email={user.email} providers={providers} />
      <AppsSection />
      <DataSection />
      <AboutSection />
    </div>
  );
}
