import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// In-memory cache for the Shiprocket token
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0; // Timestamp in milliseconds

export const DeliveryService = {
  /**
   * Authenticates with Shiprocket or returns cached token if valid.
   */
  async authenticate(): Promise<string> {
    try {
      const now = Date.now();
      
      // Check if we have a valid cached token
      if (cachedToken && now < tokenExpiryTime) {
        logger.info("Shiprocket token fetched from in-memory cache");
        return cachedToken;
      }

      logger.info("Shiprocket token not found or expired, authenticating with Shiprocket...");
      
      const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: config.shiprocket.email,
          password: config.shiprocket.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Shiprocket Authentication Failed", { errorData });
        throw new Error("Shiprocket Authentication Failed");
      }

      const data = await response.json();
      const token = data.token;

      if (!token) throw new Error("Token missing from Shiprocket response");

      // Cache the token
      cachedToken = token;
      // Set expiry to 23 hours from now (Shiprocket tokens typically last 24h)
      tokenExpiryTime = now + (23 * 60 * 60 * 1000); 
      
      logger.info("New Shiprocket token generated and cached in-memory");

      return token;
    } catch (error) {
      logger.error("Failed to authenticate with Shiprocket", { error });
      throw error;
    }
  },

  /**
   * Invalidate the current Shiprocket token and clear local cache.
   */
  async logout(): Promise<any> {
    try {
      if (!cachedToken) {
        logger.info("No active Shiprocket token to logout");
        return { success: true, message: "No active session" };
      }

      const token = cachedToken;
      // Clear cache immediately
      cachedToken = null;
      tokenExpiryTime = 0;

      const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Shiprocket Logout Failed", { errorData });
        // Even if API fails, we cleared our local cache
      }

      logger.info("Shiprocket logout successful");
      return await response.json().catch(() => ({ success: true }));
    } catch (error) {
      logger.error("Error during Shiprocket logout", { error });
      throw error;
    }
  },

  /**
   * Creates a new shipment order in Shiprocket.
   */
  async createShipment(orderData: any) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to create shipment", { error: err });
        throw new Error("Failed to create shipment");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error("Error creating shipment", { error });
      throw error;
    }
  },

  /**
   * Generates an AWB for a specific shipment.
   */
  async generateAWB(shipmentId: string) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: shipmentId })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to generate AWB", { error: err });
        throw new Error("Failed to generate AWB");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error("Error generating AWB", { error });
      throw error;
    }
  },

  /**
   * Tracks a shipment using its AWB number.
   */
  async trackShipment(awb: string) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awb}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to track shipment", { error: err });
        throw new Error("Failed to track shipment");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error("Error tracking shipment", { error });
      throw error;
    }
  },

  /**
   * Cancel an order using Shiprocket Order IDs.
   */
  async cancelOrder(ids: number[] | string[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      });
      
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        logger.error("Failed to cancel order", { error: data });
        const message = data?.message || data?.error?.message || "Failed to cancel order";
        throw new Error(message);
      }
      return data;
    } catch (error) {
      logger.error("Error canceling order", { error });
      throw error;
    }
  },

  /**
   * Cancel shipments using AWB numbers.
   */
  async cancelShipmentsByAWB(awbs: string[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel/shipment/awbs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ awbs })
      });
      
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        logger.error("Failed to cancel shipment by AWB", { error: data });
        const message = data?.message || data?.error?.message || "Failed to cancel shipment by AWB";
        throw new Error(message);
      }
      return data;
    } catch (error) {
      logger.error("Error canceling shipment by AWB", { error });
      throw error;
    }
  },

  /**
   * Check Serviceability.
   */
  async checkServiceability(params: { pickup_postcode: number|string, delivery_postcode: number|string, weight: number|string, cod: number|string }) {
    try {
      const token = await this.authenticate();
      const queryParams = new URLSearchParams(params as any).toString();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/serviceability/?${queryParams}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to check serviceability", { error: err });
        throw new Error("Failed to check serviceability");
      }
      return await response.json();
    } catch (error) {
      logger.error("Error checking serviceability", { error });
      throw error;
    }
  },

  /**
   * Request Pickup.
   */
  async requestPickup(shipment_id: number[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id })
      });
      const data = await response.json();
      if (!response.ok) {
        logger.error("Failed to request pickup", { error: data });
        const message = data?.message || data?.error?.message || "Failed to request pickup";
        throw new Error(message);
      }
      return data;
    } catch (error) {
      logger.error("Error requesting pickup", { error });
      throw error;
    }
  },

  /**
   * Generate Label.
   */
  async generateLabel(shipment_id: number[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id })
      });
      const data = await response.json();
      if (!response.ok) {
        logger.error("Failed to generate label", { error: data });
        const message = data?.message || data?.error?.message || "Failed to generate label";
        throw new Error(message);
      }
      return data;
    } catch (error) {
      logger.error("Error generating label", { error });
      throw error;
    }
  },

  /**
   * Generate Manifest.
   */
  async generateManifest(shipment_id: number[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/manifests/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to generate manifest", { error: err });
        throw new Error("Failed to generate manifest");
      }
      return await response.json();
    } catch (error) {
      logger.error("Error generating manifest", { error });
      throw error;
    }
  },

  /**
   * Generate Invoice.
   */
  async generateInvoice(ids: number[]) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/print/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to generate invoice", { error: err });
        throw new Error("Failed to generate invoice");
      }
      return await response.json();
    } catch (error) {
      logger.error("Error generating invoice", { error });
      throw error;
    }
  },

  /**
   * Forward Shipment Wrapper API (Create + AWB + Label + Manifest).
   */
  async forwardShipment(orderData: any) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/shipments/create/forward-shipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to invoke forward shipment API", { error: err });
        throw new Error("Failed to invoke forward shipment API");
      }
      return await response.json();
    } catch (error) {
      logger.error("Error invoking forward shipment API", { error });
      throw error;
    }
  },

  /**
   * Return Shipment Wrapper API.
   */
  async returnShipment(returnData: any) {
    try {
      const token = await this.authenticate();
      const response = await fetch(`${SHIPROCKET_BASE_URL}/shipments/create/return-shipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(returnData)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logger.error("Failed to invoke return shipment API", { error: err });
        throw new Error("Failed to invoke return shipment API");
      }
      return await response.json();
    } catch (error) {
      logger.error("Error invoking return shipment API", { error });
      throw error;
    }
  }
};

