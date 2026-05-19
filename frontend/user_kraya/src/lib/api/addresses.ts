import { apiRequest } from "./client";

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: "home" | "work" | "other";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressListResponse {
  success: boolean;
  data: Address[];
}

export interface SingleAddressResponse {
  success: boolean;
  data: Address;
}

export interface AddressPayload {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: string;
  isDefault?: boolean;
}

export const addressesApi = {
  get: (): Promise<AddressListResponse> =>
    apiRequest<AddressListResponse>("/addresses", { auth: true }),

  create: (data: AddressPayload): Promise<SingleAddressResponse> =>
    apiRequest<SingleAddressResponse>("/addresses", {
      method: "POST",
      body: data,
      auth: true,
    }),

  update: (id: string, data: Partial<AddressPayload>): Promise<SingleAddressResponse> =>
    apiRequest<SingleAddressResponse>(`/addresses/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/addresses/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  setDefault: (id: string): Promise<SingleAddressResponse> =>
    apiRequest<SingleAddressResponse>(`/addresses/${id}/default`, {
      method: "PUT",
      auth: true,
    }),
};
