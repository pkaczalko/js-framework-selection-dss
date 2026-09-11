import Link from 'next/link';
import type { Article } from '@/lib/api/types';
import { formatDate } from '@/lib/formatDate';
import { FavoriteButton } from './FavoriteButton';

interface ArticlePreviewProps {
  article: Article;
  onFavoriteChange?: (article: Article) => void;
}

export function ArticlePreview({ article, onFavoriteChange }: ArticlePreviewProps) {
  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link href={`/profile/${article.author.username}`}>
          <img src={article.author.image} alt="" />
        </Link>
        <div className="info">
          <Link href={`/profile/${article.author.username}`} className="author">
            {article.author.username}
          </Link>
          <span className="date">{formatDate(article.createdAt)}</span>
        </div>
        <FavoriteButton article={article} onChange={onFavoriteChange} />
      </div>
      <Link href={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map((tag) => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
