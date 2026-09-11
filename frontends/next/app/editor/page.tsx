import { RequireAuth } from '@/components/RequireAuth';
import { EditorForm } from '@/components/EditorForm';

export default function EditorPage() {
  return (
    <RequireAuth>
      <EditorForm />
    </RequireAuth>
  );
}
