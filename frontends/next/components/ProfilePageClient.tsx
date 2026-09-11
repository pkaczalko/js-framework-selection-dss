'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import type { Article, Profile } from '@/lib/api/types';
import { ArticleList } from './ArticleList';
import { FollowButton } from './FollowButton';
import { Pagination } from './Pagination';

const PAGE_SIZE = 10;

interface ProfilePageClientProps {
  profile: Profile;
  initialArticles: Article[];
  initialArticlesCount: number;
  favorites: boolean;
}

export function ProfilePageClient({
  profile: initialProfile,
  initialArticles,
  initialArticlesCount,
  favorites,
}: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [articles, setArticles] = useState(initialArticles);
  const [articlesCount, setArticlesCount] = useState(initialArticlesCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setArticles(initialArticles);
    setArticlesCount(initialArticlesCount);
    setPage(1);
  }, [initialProfile, initialArticles, initialArticlesCount, favorites]);

  useEffect(() => {
    if (page === 1) {
      setArticles(initialArticles);
      setArticlesCount(initialArticlesCount);
      return;
    }

    setLoading(true);
    const offset = PAGE_SIZE * (page - 1);
    const params = favorites
      ? { favorited: profile.username, limit: PAGE_SIZE, offset }
      : { author: profile.username, limit: PAGE_SIZE, offset };

    api
      .getArticles(params)
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
  }, [profile.username, favorites, page, initialArticles, initialArticlesCount]);

  function handleFavoriteChange(updated: Article) {
    setArticles((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  }

  const totalPages = Math.max(1, Math.ceil(articlesCount / PAGE_SIZE));

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img src={profile.image} className="user-img" alt="" />
              <h4>{profile.username}</h4>
              <p>{profile.bio}</p>
              <FollowButton profile={profile} onChange={setProfile} />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <Link
                    className={`nav-link${!favorites ? ' active' : ''}`}
                    href={`/profile/${profile.username}`}
                  >
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link${favorites ? ' active' : ''}`}
                    href={`/profile/${profile.username}/favorites`}
                  >
                    Favorited Articles
                  </Link>
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
        </div>
      </div>
    </div>
  );
}
