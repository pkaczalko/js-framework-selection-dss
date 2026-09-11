import Link from 'next/link';
import type { Article } from '@/lib/api/types';
import { formatDate } from '@/lib/formatDate';
import { FavoriteButton } from './FavoriteButton';

interface ArticleMetaProps {
  article: Article;
  onFavoriteChange?: (article: Article) => void;
}

export function ArticleMeta({ article, onFavoriteChange }: ArticleMetaProps) {
  return (
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
  );
}
