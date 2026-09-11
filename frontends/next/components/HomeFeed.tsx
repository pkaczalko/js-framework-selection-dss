'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { Article } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { ArticleList } from './ArticleList';
import { Pagination } from './Pagination';
import { TagList } from './TagList';

type FeedTab = 'global' | 'personal';

interface HomeFeedProps {
  initialArticles: Article[];
  initialArticlesCount: number;
  initialTags: string[];
  initialTag?: string;
  initialLimit: number;
}

export function HomeFeed({
  initialArticles,
  initialArticlesCount,
  initialTags,
  initialTag,
  initialLimit,
}: HomeFeedProps) {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState(initialArticles);
  const [articlesCount, setArticlesCount] = useState(initialArticlesCount);
  const [tags] = useState(initialTags);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<FeedTab>('global');
  const [page, setPage] = useState(1);

  const tag = searchParams.get('tag') ?? initialTag ?? undefined;
  const limit = Number(searchParams.get('limit') ?? String(initialLimit)) || 10;
  const offset = limit * (page - 1);

  useEffect(() => {
    setArticles(initialArticles);
    setArticlesCount(initialArticlesCount);
    setPage(1);
  }, [initialArticles, initialArticlesCount, tag, limit]);

  useEffect(() => {
    setPage(1);
  }, [tag, tab, limit]);

  useEffect(() => {
    if (page === 1 && tab === 'global') {
      setArticles(initialArticles);
      setArticlesCount(initialArticlesCount);
      return;
    }

    setLoading(true);
    const fetchFeed =
      tab === 'personal' && isAuthenticated
        ? api.getFeed({ limit, offset })
        : api.getArticles({ limit, offset, tag });

    fetchFeed
      .then(({ articles: loaded, articlesCount: count }) => {
        setArticles(loaded);
        setArticlesCount(count);
      })
      .catch(() => {
        setArticles([]);
        setArticlesCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab, isAuthenticated, limit, offset, tag, page, initialArticles, initialArticlesCount]);

  function handleFavoriteChange(updated: Article) {
    setArticles((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  }

  const totalPages = Math.max(1, Math.ceil(articlesCount / limit));

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link${tab === 'personal' ? ' active' : ''}`}
                      onClick={() => setTab('personal')}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link${tab === 'global' ? ' active' : ''}`}
                    onClick={() => setTab('global')}
                  >
                    {tag ? `#${tag}` : 'Global Feed'}
                  </button>
                </li>
              </ul>
            </div>

            {loading ? (
              <div className="article-preview">Loading...</div>
            ) : (
              <>
                <ArticleList
                  articles={articles}
                  onFavoriteChange={handleFavoriteChange}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>

          <div className="col-md-3">
            <TagList tags={tags} activeTag={tag} limit={limit} />
            {tag && (
              <p>
                <Link
                  href={
                    limit !== 10
                      ? `/?limit=${limit}`
                      : '/'
                  }
                >
                  Clear tag filter
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
