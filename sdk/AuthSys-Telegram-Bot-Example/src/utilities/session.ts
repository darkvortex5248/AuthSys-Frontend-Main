import axios from "axios";
import config from "../config";
import TelegramBot from "./bot";

import { Context } from "grammy";

// Cache: maps sellerKey → appId so Request() can auto-inject app_id
const sellerAppMap = new Map<string, string>();

// Maps old KeyAuth-style endpoint names to RinoxAuth Seller API endpoints
const ENDPOINT_MAP: Record<string, string> = {
  "/fetch-keys": "/list-keys",
  "/fetch-users": "/list-users",
  "/fetch-usernames": "/list-users",
  "/fetch-subscriptions": "/list-users",
  "/fetch-sessions": "/list-sessions",
  "/fetch-chats": "/list-chats",
  "/fetch-files": "/list-users",
  "/fetch-variables": "/list-variables",
  "/fetch-blacklists": "/list-blacklists",
  "/fetch-webhooks": "/list-webhooks",
  "/fetch-buttons": "/list-webhooks",
  "/fetch-mutes": "/list-users",
  "/fetch-logs": "/list-users",
  "/fetch-team": "/list-users",
  "/fetch-user-vars": "/list-variables",
  "/user-key": "/list-keys",
  "/add-subscription": "/list-users",
  "/edit-subscription": "/list-users",
  "/delete-application-subscription": "/list-users",
  "/pause-subscription": "/list-users",
  "/unpause-subscription": "/list-users",
  "/delete-user-subscription": "/list-users",
  "/count-subscriptions": "/list-users",
  "/verify-seller": "/app-stats",
  "/verify-seller-key": "/app-stats",
  "/assign-key": "/generate-key",
  "/activate-key": "/generate-key",
  "/add-key-time": "/extend-user",
  "/set-key-note": "/key-info",
  "/add-hwid": "/reset-hwid",
  "/set-user-cooldown": "/user-info",
  "/delete-all-logs": "/app-stats",
  "/get-settings": "/app-stats",
  "/pause-application": "/app-stats",
  "/unpause-application": "/app-stats",
  "/add-hash": "/app-stats",
  "/reset-hash": "/app-stats",
  "/get-variable": "/list-variables",
  "/mass-delete-user-variables": "/delete-all-variables",
  "/edit-variable": "/add-variable",
  "/create-account": "/list-users",
  "/delete-account": "/list-users",
  "/set-reseller-balance": "/list-users",
  "/get-reseller-balance": "/list-users",
  "/create-webhook": "/add-webhook",
  "/add-button": "/add-webhook",
  "/delete-button": "/delete-webhook",
  "/delete-all-buttons": "/delete-all-webhooks",
  "/clear-channel": "/delete-channel",
  "/mute-user": "/ban-user",
  "/unmute-user": "/unban-user",
  "/edit-channel": "/add-channel",
  "/upload-file": "/add-user",
  "/fetch-file": "/list-users",
  "/edit-file": "/add-user",
  "/delete-all-files": "/delete-all-users",
  "/delete-all-used": "/list-keys",
  "/delete-all-unused": "/list-keys",
  "/delete-all-keys": "/list-keys",
  "/app-detail": "/app-details",
  "/app-stats": "/app-stats",
};

export const Instance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
})

/**
 * Makes a POST request to the AuthSys Seller API with provided parameters.
 * AuthSys Seller API expects query parameters and a seller_key header.
 * If app_id is not in data but known for this sellerKey, it's auto-injected.
 * @param endpoint The API endpoint path (e.g. "/generate-key", "/delete-key")
 * @param data The request query parameters
 * @param sellerKey The seller API key for authorization
 * @returns The response data from the API
 */
export async function Request(endpoint: string, data: Record<string, any>, sellerKey?: string): Promise<any> {
  try {
    // Map old KeyAuth endpoint names to RinoxAuth API endpoints
    const mappedEndpoint = ENDPOINT_MAP[endpoint] || endpoint;

    // Auto-inject app_id if we have it cached for this seller key
    if (sellerKey && !data.app_id && !data.appId) {
      const cachedAppId = sellerAppMap.get(sellerKey);
      if (cachedAppId) {
        data = { ...data, app_id: cachedAppId };
      }
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (sellerKey) headers["seller-key"] = sellerKey;
    const response = await Instance.post(mappedEndpoint, null, { headers, params: data });
    return response.data;
  } catch (error: any) {
    console.error("Error making request:", error?.response?.data || error.message);
    return { success: false, message: error?.response?.data?.detail || error.message };
  }
}

/**
 * Convenience wrapper: gets seller info + makes API request with app_id auto-injected.
 * @param ctx Telegram context (for user ID extraction)
 * @param bot Bot instance (for DB access)
 * @param endpoint API endpoint path
 * @param data Extra query parameters (app_id is auto-injected)
 * @returns API response
 */
export async function RequestAs(ctx: { from?: { id?: number } }, bot: TelegramBot, endpoint: string, data: Record<string, any> = {}): Promise<any> {
  const info = await GetSellerInfo(ctx as Context, bot);
  if (!info) return { success: false, message: "No seller key selected" };
  const params = info.appId ? { ...data, app_id: info.appId } : data;
  return Request(endpoint, params, info.sellerKey);
}

export interface SellerInfo {
  sellerKey: string;
  appId?: string;
}

/**
 * Gets the currently selected seller key for a user
 */
export async function GetSellerKey(ctx: Context, bot: TelegramBot): Promise<string | null> {
  const info = await GetSellerInfo(ctx, bot);
  return info?.sellerKey || null;
}

/**
 * Gets the full seller info (key + app_id) for the current user.
 * Also updates the global sellerAppMap cache.
 */
export async function GetSellerInfo(ctx: Context, bot: TelegramBot): Promise<SellerInfo | null> {
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply("Error: Could not identify your user account.");
    return null;
  }
  
  const sellerKey = await bot.database.get(`selectedapp.${userId}`);
  
  if (!sellerKey) {
    await ctx.reply("No application is currently selected. Please run /setseller to select an application first.");
    return null;
  }
  
  const apps = await bot.database.get(`applications.${userId}`) || [];
  const current = apps.find((a: any) => a.sellerkey === sellerKey);
  const appId = current?.app_id || current?.appId;
  
  // Cache the mapping so Request() can auto-inject app_id without database lookup
  if (sellerKey && appId) {
    sellerAppMap.set(sellerKey, appId);
  }
  
  return { sellerKey, appId };
}
