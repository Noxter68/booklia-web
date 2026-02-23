import { api } from './api';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin?: boolean;
  emailVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

class AuthClient {
  private user: AuthUser | null = null;

  constructor() {
    // Initialize token from localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        api.setToken(token);
      }
    }
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }

    const result: AuthResponse = await response.json();
    this.setTokens(result.accessToken, result.refreshToken);
    this.user = result.user;
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email ou mot de passe incorrect');
    }

    const result: AuthResponse = await response.json();
    this.setTokens(result.accessToken, result.refreshToken);
    this.user = result.user;
    return result;
  }

  logout() {
    this.clearTokens();
    this.user = null;
  }

  async getSession(): Promise<AuthUser | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        // Try to refresh token
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          this.clearTokens();
          return null;
        }
        return this.getSession();
      }

      const user = await response.json();
      this.user = user;
      return user;
    } catch {
      return null;
    }
  }

  async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) return false;

      const result = await response.json();
      this.setTokens(result.accessToken, result.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    api.setToken(accessToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    api.setToken(null);
  }
}

export const authClient = new AuthClient();
