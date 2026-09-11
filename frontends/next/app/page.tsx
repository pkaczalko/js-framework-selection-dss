import { Suspense } from 'react';
import { serverApi } from '@/lib/api/server';
import { HomeFeed } from '@/components/HomeFeed';

interface PageProps {
  searchParams: Promise<{ tag?: string; limit?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tag = params.tag;
  const limit = Number(params.limit ?? '10') || 10;

  const [articlesResult, tagsResult] = await Promise.all([
    serverApi.getArticles({ limit, offset: 0, tag }).catch(() => ({
      articles: [],
      articlesCount: 0,
    })),
    serverApi.getTags().catch(() => ({ tags: [] })),
  ]);

  return (
    <Suspense fallback={<div className="article-preview">Loading...</div>}>
      <HomeFeed
        initialArticles={articlesResult.articles}
        initialArticlesCount={articlesResult.articlesCount}
        initialTags={tagsResult.tags}
        initialTag={tag}
        initialLimit={limit}
      />
    </Suspense>
  );
}
