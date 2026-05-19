import { apiRequest } from "./client";

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUserResponse {
  success: boolean;
  user?: User;
  data?: User;
}

export const userApi = {
  /** GET /user/me — requires access token */
  getMe: (): Promise<GetUserResponse> =>
    apiRequest<GetUserResponse>("/user/me", { auth: true }),

  /** PATCH /user — update profile */
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    location?: any;
  }): Promise<GetUserResponse> =>
    apiRequest<GetUserResponse>("/user", {
      method: "PATCH",
      body: data,
      auth: true,
    }),

  /** GET /sessions — list active sessions */
  getSessions: (): Promise<{ success: boolean; data: any[] }> =>
    apiRequest<{ success: boolean; data: any[] }>("/sessions", { auth: true }),

  /** DELETE /sessions/:id — invalidate a session */
  deleteSession: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest<{ success: boolean; message: string }>(`/sessions/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};
