import { Link, useSearchParams } from 'react-router';

interface TagListProps {
  tags: string[];
  activeTag?: string;
}

export function TagList({ tags, activeTag }: TagListProps) {
  const [searchParams] = useSearchParams();
  const limit = searchParams.get('limit');

  function buildTagUrl(tag: string): string {
    const params = new URLSearchParams();
    if (limit) {
      params.set('limit', limit);
    }
    if (activeTag !== tag) {
      params.set('tag', tag);
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  }

  return (
    <div className="sidebar">
      <p>Popular Tags</p>
      <div className="tag-list">
        {tags.map((tag) => (
          <Link
            key={tag}
            to={buildTagUrl(tag)}
            className={`tag-pill tag-default${activeTag === tag ? ' active' : ''}`}
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}
