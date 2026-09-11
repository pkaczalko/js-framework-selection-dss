import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api/client';
import type { Article, Profile } from '../api/types';
import { ArticleList } from '../components/ArticleList';
import { FollowButton } from '../components/FollowButton';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 10;

interface ProfilePageProps {
  favorites: boolean;
}

export function ProfilePage({ favorites }: ProfilePageProps) {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      return;
    }
    api
      .getProfile(username)
      .then(({ profile: loaded }) => {
        setProfile(loaded);
      })
      .catch(() => {
        setProfile(null);
      });
  }, [username]);

  useEffect(() => {
    if (!username) {
      return;
    }
    setLoading(true);
    const offset = PAGE_SIZE * (page - 1);
    const params = favorites
      ? { favorited: username, limit: PAGE_SIZE, offset }
      : { author: username, limit: PAGE_SIZE, offset };

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
  }, [username, favorites, page]);

  function handleFavoriteChange(updated: Article) {
    setArticles((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  }

  if (!profile) {
    return null;
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
                    to={`/profile/${profile.username}`}
                  >
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link${favorites ? ' active' : ''}`}
                    to={`/profile/${profile.username}/favorites`}
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
