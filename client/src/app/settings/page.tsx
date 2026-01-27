/*import AppLayout from "../../components/AppLayout";
import SettingsClient from "../../components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <AppLayout>
      <SettingsClient />
    </AppLayout>
  );
}
*/

import AppLayout from "../../components/AppLayout";
import SettingsClient from "../../components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <AppLayout>
      {/* Dark mode test – REMOVE after verification */}
      <div className="bg-white dark:bg-black text-black dark:text-white p-4 mb-4">
        Dark mode test
      </div>

      <SettingsClient />
    </AppLayout>
  );
}
