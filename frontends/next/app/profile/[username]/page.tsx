import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api/server';
import { ProfilePageClient } from '@/components/ProfilePageClient';

const PAGE_SIZE = 10;

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;

  try {
    const [{ profile }, articlesResult] = await Promise.all([
      serverApi.getProfile(username),
      serverApi.getArticles({ author: username, limit: PAGE_SIZE, offset: 0 }),
    ]);

    return (
      <ProfilePageClient
        profile={profile}
        initialArticles={articlesResult.articles}
        initialArticlesCount={articlesResult.articlesCount}
        favorites={false}
      />
    );
  } catch {
    redirect('/');
  }
}
