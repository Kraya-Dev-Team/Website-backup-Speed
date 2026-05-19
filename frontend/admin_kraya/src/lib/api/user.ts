import { apiRequest } from "./client";

export interface AdminUser {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  getMe: () =>
    apiRequest<{ success: boolean; user: AdminUser }>("/user/me", {
      auth: true,
    }),
};
