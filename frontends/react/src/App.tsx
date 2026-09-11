import { BrowserRouter, Route, Routes } from 'react-router';
import { GuestOnly } from './components/GuestOnly';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { ArticlePage } from './pages/ArticlePage';
import { Editor } from './pages/Editor';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ProfilePage } from './pages/ProfilePage';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:slug"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/profile/:username" element={<ProfilePage favorites={false} />} />
          <Route
            path="/profile/:username/favorites"
            element={<ProfilePage favorites={true} />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
