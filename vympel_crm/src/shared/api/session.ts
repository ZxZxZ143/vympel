"use client";

const ACCESS_TOKEN_KEY = "vympel_crm_access_token";
const REFRESH_TOKEN_KEY = "vympel_crm_refresh_token";

export const SESSION_EXPIRED_EVENT = "vympel-crm:session-expired";
export const FORBIDDEN_EVENT = "vympel-crm:forbidden";

let sessionExpiredDispatched = false;

function removeLegacyRefreshToken() {
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  removeLegacyRefreshToken();
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveSession(accessToken: string) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  removeLegacyRefreshToken();
  sessionExpiredDispatched = false;
}

export function clearSession() {
  if (typeof window === "undefined") {
    return false;
  }

  const hadAccessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  removeLegacyRefreshToken();
  return hadAccessToken;
}

export function dispatchSessionExpired() {
  if (typeof window === "undefined" || sessionExpiredDispatched) {
    return;
  }

  sessionExpiredDispatched = true;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function dispatchForbidden() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(FORBIDDEN_EVENT));
}
