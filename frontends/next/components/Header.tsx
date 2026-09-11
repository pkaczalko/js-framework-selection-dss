'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" href="/">
          conduit
        </Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <Link className="nav-link" href="/">
              Home
            </Link>
          </li>
          {isAuthenticated && user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" href="/editor">
                  <i className="ion-compose"></i>&nbsp;New Article
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/settings">
                  <i className="ion-gear-a"></i>&nbsp;Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href={`/profile/${user.username}`}>
                  <img src={user.image} className="user-pic" alt="" />
                  {user.username}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" href="/login">
                  Sign in
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/register">
                  Sign up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
