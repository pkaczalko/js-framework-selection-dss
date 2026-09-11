import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import type { User } from '../api/api.types';

const JWT_KEY = 'jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal(true);
  private readonly readyPromise: Promise<void>;

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  constructor() {
    this.readyPromise = this.initSession();
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async login(email: string, password: string): Promise<void> {
    const { user } = await this.api.login({ email, password });
    this.persistSession(user);
    this.userSignal.set(user);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    const { user } = await this.api.register({ username, email, password });
    this.persistSession(user);
    this.userSignal.set(user);
  }

  logout(): void {
    localStorage.removeItem(JWT_KEY);
    this.userSignal.set(null);
  }

  setUser(user: User): void {
    this.persistSession(user);
    this.userSignal.set(user);
  }

  private persistSession(user: User): void {
    localStorage.setItem(JWT_KEY, user.token);
  }

  private async initSession(): Promise<void> {
    const token = localStorage.getItem(JWT_KEY);
    if (!token) {
      this.loadingSignal.set(false);
      return;
    }

    try {
      const { user } = await this.api.getCurrentUser();
      this.userSignal.set({ ...user, token });
    } catch {
      localStorage.removeItem(JWT_KEY);
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
