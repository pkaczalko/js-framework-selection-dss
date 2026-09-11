import { Link } from 'react-router';
import type { Article } from '../api/types';
import { formatDate } from '../utils/formatDate';
import { FavoriteButton } from './FavoriteButton';

interface ArticleMetaProps {
  article: Article;
  onFavoriteChange?: (article: Article) => void;
}

export function ArticleMeta({ article, onFavoriteChange }: ArticleMetaProps) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={article.author.image} alt="" />
      </Link>
      <div className="info">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.username}
        </Link>
        <span className="date">{formatDate(article.createdAt)}</span>
      </div>
      <FavoriteButton article={article} onChange={onFavoriteChange} />
    </div>
  );
}
