import { marked } from 'marked';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api/server';
import { ArticlePageClient } from '@/components/ArticlePageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const [{ article }, { comments }] = await Promise.all([
      serverApi.getArticle(slug),
      serverApi.getComments(slug),
    ]);
    const htmlBody = marked.parse(article.body) as string;

    return (
      <ArticlePageClient
        article={article}
        htmlBody={htmlBody}
        initialComments={comments}
      />
    );
  } catch {
    redirect('/');
  }
}
