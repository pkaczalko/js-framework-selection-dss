import Link from 'next/link';

interface TagListProps {
  tags: string[];
  activeTag?: string;
  limit?: number;
}

export function TagList({ tags, activeTag, limit }: TagListProps) {
  function buildTagUrl(tag: string): string {
    const params = new URLSearchParams();
    if (limit !== undefined) {
      params.set('limit', String(limit));
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
            href={buildTagUrl(tag)}
            className={`tag-pill tag-default${activeTag === tag ? ' active' : ''}`}
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}
