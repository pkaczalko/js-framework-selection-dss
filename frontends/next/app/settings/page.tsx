import { RequireAuth } from '@/components/RequireAuth';
import { SettingsForm } from '@/components/SettingsForm';

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsForm />
    </RequireAuth>
  );
}
