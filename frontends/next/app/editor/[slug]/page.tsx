import { RequireAuth } from '@/components/RequireAuth';
import { EditorForm } from '@/components/EditorForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <RequireAuth>
      <EditorForm slug={slug} />
    </RequireAuth>
  );
}
