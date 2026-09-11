import type { Article } from '../api/types';
import { ArticlePreview } from './ArticlePreview';

interface ArticleListProps {
  articles: Article[];
  onFavoriteChange?: (article: Article) => void;
}

export function ArticleList({ articles, onFavoriteChange }: ArticleListProps) {
  if (articles.length === 0) {
    return <div className="empty-feed-message">No articles are here... yet.</div>;
  }

  return (
    <>
      {articles.map((article) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          onFavoriteChange={onFavoriteChange}
        />
      ))}
    </>
  );
}
