'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import type { Article } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';

interface FavoriteButtonProps {
  article: Article;
  onChange?: (article: Article) => void;
}

export function FavoriteButton({ article, onChange }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  async function toggleFavorite() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = article.favorited
        ? await api.unfavoriteArticle(article.slug)
        : await api.favoriteArticle(article.slug);
      onChange?.(result.article);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm btn-outline-primary${article.favorited ? ' active' : ''}`}
      disabled={busy}
      onClick={toggleFavorite}
    >
      <i className="ion-heart"></i>&nbsp;
      {article.favoritesCount}
    </button>
  );
}
