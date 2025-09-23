import { BASEURL } from '@/config/variables';
import superAxios from '@/utils/superAxios';

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

class AuthService {
  private baseURL = BASEURL;

  /**
   * Authenticate user with email and password
   * @param credentials - User email and password
   * @returns Promise with access and refresh tokens
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      const response = await superAxios.post<TokenResponse>('/token', credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @returns Promise with new access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await superAxios.post<RefreshTokenResponse>('/token/refresh/', {
        refresh: refreshToken
      });
      return response.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new Error(error.response?.data?.detail || 'Token refresh failed');
    }
  }

  /**
   * Store tokens in session storage
   * @param accessToken - The access token
   * @param refreshToken - The refresh token
   */
  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('auth_token', `Bearer ${accessToken}`);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Get stored access token from session storage
   * @returns The stored access token or null
   */
  getStoredAccessToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get stored refresh token from session storage
   * @returns The stored refresh token or null
   */
  getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Check if tokens exist in session storage
   * @returns True if both tokens exist
   */
  hasValidTokens(): boolean {
    return !!(this.getStoredAccessToken() && this.getStoredRefreshToken());
  }

  /**
   * Verify token and get user profile from API
   * This method verifies the token is valid and fetches the user profile
   * @returns Promise with user profile data
   */
  async verifyTokenAndGetProfile(): Promise<any> {
    try {
      console.log('🔍 AuthService: Verifying token and fetching profile...');
      const response = await superAxios.get('/user/v1/profile');
      console.log('✅ AuthService: Token verified and profile fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Token verification or profile fetch failed:', error);
      throw new Error(error.response?.data?.detail || 'Token verification failed');
    }
  }

  /**
   * Get user profile from API
   * @returns Promise with user profile data
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await superAxios.get('/user/v1/profile');
      return response.data;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch user profile');
    }
  }
}

export const authService = new AuthService();
export default authService;
