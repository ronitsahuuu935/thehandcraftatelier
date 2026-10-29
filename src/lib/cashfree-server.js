import { createClient } from "@supabase/supabase-js";

export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const baseUrl = process.env.CASHFREE_BASE_URL?.trim().replace(/\/+$/, "");
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!appId || !secret || !baseUrl || !supabaseUrl || !publishableKey || !serviceKey) return null;
  return { appId, secret, baseUrl, apiVersion, supabaseUrl, publishableKey, serviceKey };
}

export async function getAuthorizedUser(request, config) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const authClient = createClient(config.supabaseUrl, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user || null;
}

export function getAdminClient(config) {
  return createClient(config.supabaseUrl, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function cashfreeHeaders(config, extra = {}) {
  return {
    "content-type": "application/json",
    "x-client-id": config.appId,
    "x-client-secret": config.secret,
    "x-api-version": config.apiVersion,
    ...extra
  };
}

export function normalizeIndianPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}
