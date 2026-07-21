"use client";

import {
  clearSession,
  dispatchForbidden,
  dispatchSessionExpired,
  getAccessToken,
  saveSession,
} from "@/shared/api/session";
import {
  Activity,
  AuthResponse,
  CollectionPayload,
  CmsBlock,
  CmsBlockPayload,
  CmsMedia,
  CmsPage,
  CmsPageSummary,
  CrmCollection,
  CrmUser,
  CrmRole,
  CustomerRequest,
  CustomerRequestStatus,
  Dashboard,
  ManagedUser,
  Page,
  Product,
  ProductBulkCreatePayload,
  ProductBulkCreateResult,
  ProductPopularityAnalytics,
  ProductAnalyticsPeriod,
  ProductPopularityRow,
  ProductPromotionMode,
  ProductPayload,
  ProductReview,
  ProductReviewStatus,
  ProductStatus,
  References,
  UserPayload,
} from "@/shared/api/types";
import { reportTelemetry } from "@/shared/telemetry/telemetry";

export class CrmApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  requestId?: string;
  retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
    requestId?: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const crmApiBase = process.env.NEXT_PUBLIC_CRM_API_BASE ?? "http://localhost:8080/api/crm";

type RequestOptions = RequestInit & {
  withAuth?: boolean;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  details?: unknown;
  requestId?: string;
  retryAfterSeconds?: number;
};

let refreshPromise: Promise<string> | null = null;

function createHeaders(options: RequestOptions, accessToken?: string | null) {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.delete("Authorization");
  }

  return headers;
}

async function performFetch(path: string, options: RequestOptions, accessToken?: string | null) {
  try {
    return await fetch(`${crmApiBase}${path}`, {
      ...options,
      headers: createHeaders(options, accessToken),
      cache: "no-store",
      credentials: "include",
    });
  } catch (error) {
    reportTelemetry({
      kind: "api_error",
      name: "NetworkError",
      message: error instanceof Error ? error.message : "Network request failed",
      route: path,
    });
    throw error;
  }
}

async function toApiError(response: Response) {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  const bodyRetryAfter = Number(payload?.retryAfterSeconds);
  const headerRetryAfter = parseRetryAfter(response.headers.get("retry-after"));
  const retryAfterSeconds = Number.isFinite(bodyRetryAfter) && bodyRetryAfter > 0
    ? Math.min(86400, Math.ceil(bodyRetryAfter))
    : headerRetryAfter;

  const error = new CrmApiError(
    response.status,
    payload?.message ?? response.statusText,
    payload?.code,
    payload?.details,
    payload?.requestId ?? response.headers.get("x-request-id") ?? undefined,
    retryAfterSeconds
  );
  if (response.status >= 500) {
    reportTelemetry({
      kind: "api_error",
      name: "CrmApiError",
      message: error.message,
      requestId: error.requestId,
      status: response.status,
      route: response.url,
    });
  }
  return error;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(86400, Math.ceil(seconds));
  }

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.min(86400, Math.max(1, Math.ceil((date - Date.now()) / 1000)));
  }
  return undefined;
}

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new CrmApiError(response.status, "Invalid API response", "INVALID_RESPONSE");
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const hadAccessToken = getAccessToken() !== null;
  refreshPromise = (async () => {
    const response = await performFetch("/auth/refresh", { method: "POST", withAuth: false });

    if (!response.ok) {
      throw await toApiError(response);
    }

    const auth = await readResponse<AuthResponse>(response);
    saveSession(auth.accessToken);
    return auth.accessToken;
  })()
    .catch((error: unknown) => {
      if (!(error instanceof CrmApiError) || error.status !== 401) {
        throw error;
      }
      const clearedAccessToken = clearSession();
      if (hadAccessToken || clearedAccessToken) {
        dispatchSessionExpired();
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function crmFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const withAuth = options.withAuth ?? true;
  let response = await performFetch(path, options, withAuth ? getAccessToken() : null);

  if (response.status === 401 && withAuth) {
    const refreshedAccessToken = await refreshAccessToken();
    response = await performFetch(path, options, refreshedAccessToken);
  }

  if (response.status === 401) {
    if (withAuth) {
      const hadAccessToken = clearSession();
      if (hadAccessToken) {
        dispatchSessionExpired();
      }
    }
    throw await toApiError(response);
  }

  if (response.status === 403) {
    dispatchForbidden();
    throw await toApiError(response);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return readResponse<T>(response);
}

export const crmApi = {
  login(email: string, password: string) {
    return crmFetch<AuthResponse>("/auth/login", {
      method: "POST",
      withAuth: false,
      body: JSON.stringify({ email, password }),
    });
  },
  restoreSession() {
    return refreshAccessToken();
  },
  async logout() {
    await crmFetch<void>("/auth/logout", {
      method: "POST",
      withAuth: false,
    });
    clearSession();
  },
  me() {
    return crmFetch<CrmUser>("/auth/me");
  },
  dashboard(lang: string) {
    return crmFetch<Dashboard>(`/dashboard?lang=${encodeURIComponent(lang)}`);
  },
  reviews(params: {
    lang: string;
    page?: number;
    size?: number;
    status?: ProductReviewStatus | "ALL";
    product?: string;
    rating?: number;
    hasText?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const query = new URLSearchParams({
      lang: params.lang,
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
      status: params.status ?? "ALL",
      sort: "createdAt,desc",
    });

    if (params.product) query.set("product", params.product);
    if (params.rating) query.set("rating", String(params.rating));
    if (params.hasText !== undefined) query.set("hasText", String(params.hasText));
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);

    return crmFetch<Page<ProductReview>>(`/reviews?${query.toString()}`);
  },
  pendingReviewCount() {
    return crmFetch<{ count: number }>("/reviews/pending-count");
  },
  requests(params: {
    page?: number;
    size?: number;
    status?: CustomerRequestStatus | "ALL";
    search?: string;
  }) {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
      status: params.status ?? "ALL",
      sort: "createdAt,desc",
    });

    if (params.search) query.set("search", params.search);

    return crmFetch<Page<CustomerRequest>>(`/requests?${query.toString()}`);
  },
  newRequestCount() {
    return crmFetch<{ count: number }>("/requests/new-count");
  },
  request(id: number) {
    return crmFetch<CustomerRequest>(`/requests/${id}`);
  },
  updateRequestStatus(id: number, status: CustomerRequestStatus) {
    return crmFetch<CustomerRequest>(`/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  updateRequestComment(id: number, adminComment: string | null) {
    return crmFetch<CustomerRequest>(`/requests/${id}/comment`, {
      method: "PATCH",
      body: JSON.stringify({ adminComment }),
    });
  },
  cancelRequest(id: number) {
    return crmFetch<CustomerRequest>(`/requests/${id}`, {
      method: "DELETE",
    });
  },
  approveReview(id: number, lang: string) {
    return crmFetch<ProductReview>(`/reviews/${id}/approve?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
    });
  },
  rejectReview(id: number, lang: string) {
    return crmFetch<ProductReview>(`/reviews/${id}/reject?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
    });
  },
  deleteReview(id: number, lang: string) {
    return crmFetch<ProductReview>(`/reviews/${id}?lang=${encodeURIComponent(lang)}`, {
      method: "DELETE",
    });
  },
  products(params: { lang: string; page?: number; size?: number; search?: string; status?: string }) {
    const query = new URLSearchParams({
      lang: params.lang,
      page: String(params.page ?? 0),
      size: String(params.size ?? 12),
    });

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.status) {
      query.set("status", params.status);
    }

    return crmFetch<Page<Product>>(`/products?${query.toString()}`);
  },
  product(id: number, lang: string) {
    return crmFetch<Product>(`/products/${id}?lang=${encodeURIComponent(lang)}`);
  },
  createProduct(payload: ProductPayload, lang: string) {
    return crmFetch<Product>(`/products?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createProductsBulk(payload: ProductBulkCreatePayload, lang: string) {
    return crmFetch<ProductBulkCreateResult>(`/products/bulk?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: number, payload: ProductPayload, lang: string) {
    return crmFetch<Product>(`/products/${id}?lang=${encodeURIComponent(lang)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  archiveProduct(id: number, lang: string) {
    return crmFetch<Product>(`/products/${id}?lang=${encodeURIComponent(lang)}`, {
      method: "DELETE",
    });
  },
  updatePrice(id: number, price: number, lang: string) {
    return crmFetch<Product>(`/products/${id}/price?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ price }),
    });
  },
  updateStock(id: number, stockQuantity: number, lang: string) {
    return crmFetch<Product>(`/products/${id}/stock?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ stockQuantity }),
    });
  },
  updateStatus(id: number, status: ProductStatus, lang: string) {
    return crmFetch<Product>(`/products/${id}/status?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  updateMarketplaceLinks(id: number, kaspiUrl: string, wildberriesUrl: string, lang: string) {
    return crmFetch<Product>(`/products/${id}/marketplace-links?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ kaspiUrl, wildberriesUrl }),
    });
  },
  uploadProductImages(id: number, files: File[], lang: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return crmFetch<Product>(`/products/${id}/images?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      body: formData,
    });
  },
  reorderProductImages(id: number, imageIds: number[], lang: string) {
    return crmFetch<Product>(`/products/${id}/images/order?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ imageIds }),
    });
  },
  setMainProductImage(id: number, imageId: number, lang: string) {
    return crmFetch<Product>(`/products/${id}/images/${imageId}/main?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
    });
  },
  deleteProductImage(id: number, imageId: number, lang: string) {
    return crmFetch<Product>(`/products/${id}/images/${imageId}?lang=${encodeURIComponent(lang)}`, {
      method: "DELETE",
    });
  },
  references(lang: string) {
    return crmFetch<References>(`/references?lang=${encodeURIComponent(lang)}`);
  },
  collections(params: { lang: string; brandId?: number }) {
    const query = new URLSearchParams({ lang: params.lang });

    if (params.brandId) {
      query.set("brandId", String(params.brandId));
    }

    return crmFetch<CrmCollection[]>(`/collections?${query.toString()}`);
  },
  createCollection(payload: CollectionPayload, lang: string) {
    return crmFetch<CrmCollection>(`/collections?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  activity(params: { page?: number; size?: number }) {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 25),
    });

    return crmFetch<Page<Activity>>(`/activity?${query.toString()}`);
  },
  productPopularityAnalytics(params: { lang: string; period: ProductAnalyticsPeriod }) {
    const query = new URLSearchParams({
      lang: params.lang,
      period: params.period,
    });

    return crmFetch<ProductPopularityAnalytics>(`/analytics/products/popularity?${query.toString()}`);
  },
  updateProductPromotion(id: number, promotionMode: ProductPromotionMode, lang: string) {
    return crmFetch<ProductPopularityRow>(`/analytics/products/${id}/promotion?lang=${encodeURIComponent(lang)}`, {
      method: "PATCH",
      body: JSON.stringify({ promotionMode }),
    });
  },
  cmsPages() {
    return crmFetch<CmsPageSummary[]>("/cms/pages");
  },
  cmsPage(pageKey: string) {
    return crmFetch<CmsPage>(`/cms/pages/${encodeURIComponent(pageKey)}`);
  },
  createCmsBlock(payload: CmsBlockPayload) {
    return crmFetch<CmsBlock>("/cms/blocks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCmsBlock(id: number, payload: CmsBlockPayload) {
    return crmFetch<CmsBlock>(`/cms/blocks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteCmsBlock(id: number) {
    return crmFetch<CmsBlock>(`/cms/blocks/${id}`, {
      method: "DELETE",
    });
  },
  reorderCmsBlock(id: number, sortOrder: number) {
    return crmFetch<CmsBlock>(`/cms/blocks/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ sortOrder }),
    });
  },
  publishCmsBlock(id: number) {
    return crmFetch<CmsBlock>(`/cms/blocks/${id}/publish`, {
      method: "PATCH",
    });
  },
  unpublishCmsBlock(id: number) {
    return crmFetch<CmsBlock>(`/cms/blocks/${id}/unpublish`, {
      method: "PATCH",
    });
  },
  uploadCmsMedia(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return crmFetch<CmsMedia>("/cms/media/upload", {
      method: "POST",
      body: formData,
    });
  },
  users(params: { page?: number; size?: number; search?: string }) {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
    });

    if (params.search) {
      query.set("search", params.search);
    }

    return crmFetch<Page<ManagedUser>>(`/users?${query.toString()}`);
  },
  user(id: number) {
    return crmFetch<ManagedUser>(`/users/${id}`);
  },
  userRoles() {
    return crmFetch<CrmRole[]>("/users/roles");
  },
  createUser(payload: UserPayload) {
    return crmFetch<ManagedUser>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateUser(id: number, payload: UserPayload) {
    const body = {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      roles: payload.roles,
      enabled: payload.enabled,
    };

    return crmFetch<ManagedUser>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  updateUserRoles(id: number, roles: string[]) {
    return crmFetch<ManagedUser>(`/users/${id}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    });
  },
  updateUserStatus(id: number, enabled: boolean) {
    return crmFetch<ManagedUser>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  },
};
