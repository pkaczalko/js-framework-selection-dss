'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError, parseErrors } from '@/lib/api/client';
import { ErrorMessages } from '@/components/ErrorMessages';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(parseErrors(err.errors));
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign in</h1>
            <p className="text-xs-center">
              <Link href="/register">Need an account?</Link>
            </p>
            <ErrorMessages errors={errors} />
            <form onSubmit={handleSubmit}>
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </fieldset>
              <button type="submit" className="btn btn-lg btn-primary pull-xs-right">
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
