import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api/client';
import type { Article } from '../api/types';
import { ArticleMeta } from '../components/ArticleMeta';
import { CommentSection } from '../components/CommentSection';
import { useAuth } from '../hooks/useAuth';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }
    api
      .getArticle(slug)
      .then(({ article: loaded }) => {
        setArticle(loaded);
      })
      .catch(() => {
        navigate('/');
      });
  }, [slug, navigate]);

  const htmlBody = useMemo(() => {
    if (!article) {
      return '';
    }
    return marked.parse(article.body) as string;
  }, [article]);

  if (!article) {
    return null;
  }

  const isAuthor = user?.username === article.author.username;

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta
            article={article}
            onFavoriteChange={(updated) => setArticle(updated)}
          />
          {isAuthor && (
            <Link
              to={`/editor/${article.slug}`}
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="ion-edit"></i> Edit Article
            </Link>
          )}
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-xs-12">
            <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
            <ul className="tag-list">
              {article.tagList.map((tag) => (
                <li key={tag} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
            {isAuthor && (
              <span className="mod-options">
                <Link to={`/editor/${article.slug}`}>
                  <i className="ion-edit"></i>
                </Link>
                <button
                  type="button"
                  className="btn-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={async () => {
                    await api.deleteArticle(article.slug);
                    navigate('/');
                  }}
                >
                  <i className="ion-trash-a"></i>
                </button>
              </span>
            )}
            <hr />
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            <CommentSection slug={article.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
