'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, parseErrors } from '@/lib/api/client';
import { ErrorMessages } from '@/components/ErrorMessages';
import { useAuth } from '@/hooks/useAuth';

interface EditorFormProps {
  slug?: string;
}

export function EditorForm({ slug }: EditorFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isEditing = Boolean(slug);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!slug) {
      return;
    }

    api
      .getArticle(slug)
      .then(({ article }) => {
        if (user && article.author.username !== user.username) {
          router.replace('/');
          return;
        }
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      })
      .catch(() => {
        router.replace('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, user, router]);

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList([...tagList, tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTagList(tagList.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const articleData = { title, description, body, tagList };

    try {
      if (isEditing && slug) {
        const { article } = await api.updateArticle(slug, articleData);
        router.push(`/article/${article.slug}`);
      } else {
        const { article } = await api.createArticle(articleData);
        router.push(`/article/${article.slug}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(parseErrors(err.errors));
      }
    }
  }

  async function handleDelete() {
    if (!slug) {
      return;
    }
    await api.deleteArticle(slug);
    router.push('/');
  }

  if (loading) {
    return null;
  }

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ErrorMessages errors={errors} />
            <form onSubmit={handleSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Article Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span key={tag} className="tag-default tag-pill">
                        <i
                          className="ion-close-round"
                          role="button"
                          tabIndex={0}
                          onClick={() => removeTag(tag)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              removeTag(tag);
                            }
                          }}
                        ></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="submit"
                  className="btn btn-lg pull-xs-right btn-primary"
                >
                  Publish Article
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                  >
                    Delete Article
                  </button>
                )}
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
