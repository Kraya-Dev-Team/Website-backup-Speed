import { apiRequest } from "./client";

export const adminMediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest<{ success: boolean; data: { url: string; publicId: string } }>("/admin/upload", {
      method: "POST",
      body: formData,
      auth: true,
      // Note: apiRequest should handle FormData by not setting Content-Type to application/json
    });
  },

  uploadBulk: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return apiRequest<{ success: boolean; data: { url: string; publicId: string }[] }>("/admin/upload/bulk", {
      method: "POST",
      body: formData,
      auth: true,
    });
  }
};
