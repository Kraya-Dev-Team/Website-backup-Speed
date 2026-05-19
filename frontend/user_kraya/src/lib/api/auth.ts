import { apiRequest, tokenStorage } from "./client";

export interface AuthUser {
  id: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  /**
   * POST /auth/send-otp
   * Confirmed in OmniCore backend and Postman collection.
   */
  sendOtp: (phone: string, captchaToken?: string): Promise<{ success: boolean; message?: string }> =>
    apiRequest("/auth/send-otp", {
      method: "POST",
      body: { phone, captchaToken },
    }),

  verifyOtp: async (phone: string, code: string, captchaToken?: string): Promise<any> => {
    const res = await apiRequest<any>("/auth/verify-otp", {
      method: "POST",
      body: { phone, code, captchaToken },
    });
    const tokens = res.data || res;
    tokenStorage.set(tokens.accessToken, tokens.refreshToken);
    return res;
  },

  /**
   * POST /auth/refresh
   * Refreshes the access token using a refresh token.
   */
  refresh: async (): Promise<any | null> => {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) return null;
    try {
      const res = await apiRequest<any>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });
      const tokens = res.data || res;
      tokenStorage.set(tokens.accessToken, tokens.refreshToken);
      return res;
    } catch {
      return null;
    }
  },

  /**
   * POST /auth/logout
   * Clears tokens locally and invalidates session on server.
   */
  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: { refreshToken },
      }).catch(() => {});
    }
    tokenStorage.clear();
  },

  /** POST /auth/logout-all */
  logoutAll: (): Promise<{ success: boolean; message: string }> =>
    apiRequest("/auth/logout-all", { method: "POST", auth: true }),

  /** POST /auth/send-email-otp */
  sendEmailOtp: (email: string): Promise<{ success: boolean; message: string }> =>
    apiRequest("/auth/send-email-otp", {
      method: "POST",
      body: { email },
      auth: true,
    }),

  /** POST /auth/verify-email */
  verifyEmail: (
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string }> =>
    apiRequest("/auth/verify-email", {
      method: "POST",
      body: { email, code },
      auth: true,
    }),
};
