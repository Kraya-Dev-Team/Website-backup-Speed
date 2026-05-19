import { apiRequest, tokenStorage } from "./client";

export const authApi = {
  sendOtp: (phone: string) =>
    apiRequest<{ success: boolean; message?: string }>("/auth/send-otp", {
      method: "POST",
      body: { phone },
    }),

  verifyOtp: async (phone: string, code: string): Promise<any> => {
    const res = await apiRequest<any>("/auth/verify-otp", {
      method: "POST",
      body: { phone, code },
    });
    const tokens = res.data || res;
    tokenStorage.set(tokens.accessToken, tokens.refreshToken);
    return res;
  },

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
};
