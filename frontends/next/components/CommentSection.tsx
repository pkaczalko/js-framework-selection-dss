'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError, parseErrors } from '@/lib/api/client';
import type { Comment } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/formatDate';
import { ErrorMessages } from './ErrorMessages';

interface CommentSectionProps {
  slug: string;
  initialComments: Comment[];
}

export function CommentSection({ slug, initialComments }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const { comment } = await api.addComment(slug, body);
      setComments((prev) => [...prev, comment]);
      setBody('');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(parseErrors(err.errors));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await api.deleteComment(slug, id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="row">
      <div className="col-xs-12">
        {isAuthenticated && user && (
          <form className="card comment-form" onSubmit={handleSubmit}>
            <div className="card-block">
              <ErrorMessages errors={errors} />
              <textarea
                className="form-control"
                placeholder="Write a comment..."
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="card-footer">
              <img src={user.image} className="comment-author-img" alt="" />
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={submitting}
              >
                Post Comment
              </button>
            </div>
          </form>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="card">
            <div className="card-block">
              <p className="card-text">{comment.body}</p>
            </div>
            <div className="card-footer">
              <Link href={`/profile/${comment.author.username}`} className="comment-author">
                <img src={comment.author.image} className="comment-author-img" alt="" />
              </Link>
              &nbsp;
              <Link href={`/profile/${comment.author.username}`} className="comment-author">
                {comment.author.username}
              </Link>
              <span className="date-posted">{formatDate(comment.createdAt)}</span>
              {user?.username === comment.author.username && (
                <span className="mod-options">
                  <i
                    className="ion-trash-a"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDelete(comment.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDelete(comment.id);
                      }
                    }}
                  ></i>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
