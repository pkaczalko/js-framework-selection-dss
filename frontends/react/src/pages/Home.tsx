import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/client';
import type { Article } from '../api/types';
import { ArticleList } from '../components/ArticleList';
import { Pagination } from '../components/Pagination';
import { TagList } from '../components/TagList';
import { useAuth } from '../hooks/useAuth';

type FeedTab = 'global' | 'personal';

export function Home() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>('global');
  const [page, setPage] = useState(1);

  const tag = searchParams.get('tag') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '10') || 10;
  const offset = limit * (page - 1);

  useEffect(() => {
    api.getTags().then(({ tags: loadedTags }) => {
      setTags(loadedTags);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tag, tab, limit]);

  useEffect(() => {
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
  }, [tab, isAuthenticated, limit, offset, tag]);

  function handleTagClick(clear: boolean) {
    if (clear) {
      const next = new URLSearchParams(searchParams);
      next.delete('tag');
      setSearchParams(next);
    }
  }

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
            <TagList tags={tags} activeTag={tag} />
            {tag && (
              <p>
                <Link to="/" onClick={() => handleTagClick(true)}>
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
