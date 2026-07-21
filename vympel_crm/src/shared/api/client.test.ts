import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrmApiError, crmApi } from "@/shared/api/client";
import {
  FORBIDDEN_EVENT,
  SESSION_EXPIRED_EVENT,
  clearSession,
  getAccessToken,
  saveSession,
} from "@/shared/api/session";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();
const events = new EventTarget();
const windowMock = {
  sessionStorage: storage,
  addEventListener: events.addEventListener.bind(events),
  removeEventListener: events.removeEventListener.bind(events),
  dispatchEvent: events.dispatchEvent.bind(events),
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function accessHeader(init?: RequestInit) {
  return new Headers(init?.headers).get("Authorization");
}

describe("CRM API authentication lifecycle", () => {
  beforeEach(() => {
    vi.stubGlobal("window", windowMock);
    storage.clear();
    saveSession("reset-notification-state");
    clearSession();
    vi.restoreAllMocks();
  });

  it("preserves the valid session on 403 and raises a forbidden signal", async () => {
    saveSession("valid-access");
    const forbidden = vi.fn();
    const expired = vi.fn();
    window.addEventListener(FORBIDDEN_EVENT, forbidden);
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(403, { code: "FORBIDDEN" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.me()).rejects.toMatchObject({ status: 403 });

    expect(getAccessToken()).toBe("valid-access");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(forbidden).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
    window.removeEventListener(FORBIDDEN_EVENT, forbidden);
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  });

  it("exposes safe retry timing for a throttled login without touching session state", async () => {
    const response = new Response(JSON.stringify({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests.",
      requestId: "request-429",
      retryAfterSeconds: 41,
    }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "41" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(crmApi.login("manager@example.com", "wrong"))
      .rejects.toMatchObject({
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        requestId: "request-429",
        retryAfterSeconds: 41,
      });
    expect(getAccessToken()).toBeNull();
  });

  it("refreshes once on 401 and retries the original request with the new access token", async () => {
    saveSession("expired-access");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: "UNAUTHORIZED" }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: "new-access" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1, roles: ["ADMIN"] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.me()).resolves.toMatchObject({ id: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/auth/refresh");
    expect(accessHeader(fetchMock.mock.calls[2][1])).toBe("Bearer new-access");
    expect(fetchMock.mock.calls.every((call) => call[1]?.credentials === "include")).toBe(true);
    expect(getAccessToken()).toBe("new-access");
  });

  it("coalesces simultaneous 401 responses into a single refresh request", async () => {
    saveSession("expired-access");
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        await refreshGate;
        return jsonResponse(200, { accessToken: "shared-access" });
      }
      if (accessHeader(init) === "Bearer shared-access") {
        return jsonResponse(200, { id: 1, roles: ["ADMIN"] });
      }
      return jsonResponse(401, { code: "UNAUTHORIZED" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = crmApi.me();
    const second = crmApi.me();
    await vi.waitFor(() => expect(refreshCalls).toBe(1));
    releaseRefresh();

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(refreshCalls).toBe(1);
  });

  it("clears the access token once when refresh fails without recursion", async () => {
    saveSession("expired-access");
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: "UNAUTHORIZED" }))
      .mockResolvedValueOnce(jsonResponse(401, { code: "INVALID_SESSION" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.me()).rejects.toBeInstanceOf(CrmApiError);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  });

  it("preserves a valid access session when refresh is throttled", async () => {
    saveSession("still-valid-access");
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: "UNAUTHORIZED" }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: 17,
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "17" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.me()).rejects.toMatchObject({ status: 429, retryAfterSeconds: 17 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBe("still-valid-access");
    expect(expired).not.toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  });

  it("does not loop when the retried request is still unauthorized", async () => {
    saveSession("expired-access");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: "new-access" }))
      .mockResolvedValueOnce(jsonResponse(401, {}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.me()).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBeNull();
  });

  it("restores a session from the HttpOnly cookie without an access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { accessToken: "restored-access" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(crmApi.restoreSession()).resolves.toBe("restored-access");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/refresh");
    expect(accessHeader(fetchMock.mock.calls[0][1])).toBeNull();
    expect(getAccessToken()).toBe("restored-access");
  });

  it("clears local state only after successful server logout", async () => {
    saveSession("valid-access");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await crmApi.logout();

    expect(getAccessToken()).toBeNull();
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
  });

  it("keeps local state when server logout fails", async () => {
    saveSession("valid-access");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(crmApi.logout()).rejects.toThrow("offline");

    expect(getAccessToken()).toBe("valid-access");
  });
});
