
"use client"
import AppLayout from "../../components/AppLayout";
import SettingsClient from "../../components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <AppLayout hideSidebar> {/* hide sidebar only for settings */}
      <SettingsClient />
    </AppLayout>
  );
}


