'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, parseErrors } from '@/lib/api/client';
import { ErrorMessages } from '@/components/ErrorMessages';
import { useAuth } from '@/hooks/useAuth';

export function SettingsForm() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setImage(user.image);
      setUsername(user.username);
      setBio(user.bio);
      setEmail(user.email);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const payload: {
      image: string;
      username: string;
      bio: string;
      email: string;
      password?: string;
    } = { image, username, bio, email };

    if (password) {
      payload.password = password;
    }

    try {
      const { user: updated } = await api.updateUser(payload);
      setUser(updated);
      router.push(`/profile/${updated.username}`);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(parseErrors(err.errors));
      }
    }
  }

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <ErrorMessages errors={errors} />
            <form onSubmit={handleSubmit}>
              <fieldset className="form-group">
                <input
                  className="form-control"
                  type="text"
                  placeholder="URL of profile picture"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <textarea
                  className="form-control form-control-lg"
                  rows={8}
                  placeholder="Short bio about you"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </fieldset>
              <button type="submit" className="btn btn-lg btn-primary pull-xs-right">
                Update Settings
              </button>
            </form>
            <hr />
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
