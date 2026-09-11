'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { Article, Comment } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { ArticleMeta } from './ArticleMeta';
import { CommentSection } from './CommentSection';

interface ArticlePageClientProps {
  article: Article;
  htmlBody: string;
  initialComments: Comment[];
}

export function ArticlePageClient({
  article: initialArticle,
  htmlBody,
  initialComments,
}: ArticlePageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [article, setArticle] = useState(initialArticle);

  const isAuthor = user?.username === article.author.username;

  async function handleDelete() {
    await api.deleteArticle(article.slug);
    router.push('/');
  }

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
              href={`/editor/${article.slug}`}
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
                <Link href={`/editor/${article.slug}`}>
                  <i className="ion-edit"></i>
                </Link>
                <button
                  type="button"
                  className="btn-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={handleDelete}
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
            <CommentSection slug={article.slug} initialComments={initialComments} />
          </div>
        </div>
      </div>
    </div>
  );
}
