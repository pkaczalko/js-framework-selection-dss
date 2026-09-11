import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { EditorComponent } from './pages/editor/editor.component';
import { ArticleComponent } from './pages/article/article.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'editor', component: EditorComponent, canActivate: [authGuard] },
  { path: 'editor/:slug', component: EditorComponent, canActivate: [authGuard] },
  { path: 'article/:slug', component: ArticleComponent },
  {
    path: 'profile/:username',
    component: ProfileComponent,
    data: { favorites: false },
  },
  {
    path: 'profile/:username/favorites',
    component: ProfileComponent,
    data: { favorites: true },
  },
];
