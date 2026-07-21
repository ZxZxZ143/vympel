"use client";

import {useCallback, useEffect, useMemo, useSyncExternalStore} from "react";

import type {
    IProductBatchSummaryItem,
    IProductDetails,
    IProductFeature,
    IProductImage
} from "@/api/types/ProductTypes";
import {routes} from "@/config/routes";

export const FAVORITES_STORAGE_KEY = "vympel:favorites";
export const CART_STORAGE_KEY = "vympel:cart";

const FAVORITES_CHANGE_EVENT = "vympel:favorites:change";
const CART_CHANGE_EVENT = "vympel:cart:change";

export type ProductSnapshot = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    collection?: IProductFeature | null;
    description?: string | null;
    sku?: string | null;
    stockQuantity?: number | null;
    status?: string | null;
    href: string;
    categoryCode?: string | null;
    categoryName?: string | null;
    brandId?: string | null;
    brandName?: string | null;
    ratingAverage?: number | null;
    ratingCount?: number | null;
};

export type ProductSnapshotInput = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    img?: string | null;
    images?: IProductImage[] | string[] | null;
    collection?: IProductFeature | null;
    sku?: string | null;
    stockQuantity?: number | null;
    status?: string | null;
    href?: string;
    link?: string;
    category?: IProductDetails["category"];
    brand?: IProductDetails["brand"];
    description?: IProductDetails["description"] | string | null;
    ratingAverage?: number | null;
    ratingCount?: number | null;
};

export type FavoriteStoreItem = {
    productId: number;
    snapshot?: ProductSnapshot;
    updatedAt: number;
};

export type CartStoreItem = {
    productId: number;
    quantity: number;
    snapshot?: ProductSnapshot;
    updatedAt: number;
};

type FavoriteStore = Record<string, FavoriteStoreItem>;
type CartStore = Record<string, CartStoreItem>;

export type StorageMutationStatus =
    | "added"
    | "removed"
    | "updated"
    | "alreadyInCart"
    | "unavailable"
    | "stockLimit"
    | "failed"
    | "cleared"
    | "decremented"
    | "noop";

export type StorageMutationResult = {
    ok: boolean;
    status: StorageMutationStatus;
    quantity?: number;
    previousQuantity?: number;
    isFavorite?: boolean;
};

export type AddCartProductOptions = {
    incrementExisting?: boolean;
};

const EMPTY_FAVORITES: FavoriteStore = {};
const EMPTY_CART: CartStore = {};

let favoritesCache: FavoriteStore = EMPTY_FAVORITES;
let cartCache: CartStore = EMPTY_CART;
let favoritesHydrated = false;
let cartHydrated = false;

const isBrowser = () => typeof window !== "undefined";

function debugLocalProductStorage(message: string, details: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
        console.debug(message, details);
    }
}

function getProductIdKey(productId: number) {
    return String(productId);
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function toProductId(value: unknown): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseStoredValue(key: string): unknown {
    if (!isBrowser()) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        debugLocalProductStorage("Vympel local product storage read failed; resetting key.", {key, error});
        resetStoredValue(key);
        return null;
    }
}

function resetStoredValue(key: string) {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        debugLocalProductStorage("Vympel local product storage reset failed.", {key, error});
    }
}

function parseStorageEventValue(value: string | null): unknown {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function persistStoredValue<TStore extends Record<string, unknown>>(
    key: string,
    value: TStore
): boolean {
    if (!isBrowser()) {
        return false;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        debugLocalProductStorage("Vympel local product storage write failed.", {key, error});
        return false;
    }
}

function dispatchStoreChange(changeEvent: string) {
    if (!isBrowser()) {
        return;
    }

    try {
        window.dispatchEvent(new Event(changeEvent));
    } catch (error) {
        debugLocalProductStorage("Vympel local product storage change event failed.", {changeEvent, error});
    }
}

function normalizeTimestamp(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

function normalizeSnapshot(value: unknown): ProductSnapshot | undefined {
    const record = asRecord(value);
    if (!record) {
        return undefined;
    }

    const productId = toProductId(record.id);
    const name = typeof record.name === "string" ? record.name : "";
    const price = Number(record.price);

    if (!productId || !name || !Number.isFinite(price)) {
        return undefined;
    }

    return {
        id: productId,
        name,
        price,
        imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : null,
        collection: asRecord(record.collection) as IProductFeature | null,
        description: typeof record.description === "string" ? record.description : null,
        sku: typeof record.sku === "string" ? record.sku : null,
        stockQuantity: record.stockQuantity == null ? null : Number(record.stockQuantity),
        status: typeof record.status === "string" ? record.status : null,
        href: typeof record.href === "string" ? record.href : routes.product(productId),
        categoryCode: typeof record.categoryCode === "string" ? record.categoryCode : null,
        categoryName: typeof record.categoryName === "string" ? record.categoryName : null,
        brandId: typeof record.brandId === "string" ? record.brandId : null,
        brandName: typeof record.brandName === "string" ? record.brandName : null,
        ratingAverage: record.ratingAverage == null ? null : Number(record.ratingAverage),
        ratingCount: record.ratingCount == null ? 0 : Number(record.ratingCount),
    };
}

function areProductFeaturesEqual(left?: IProductFeature | null, right?: IProductFeature | null): boolean {
    if (!left && !right) {
        return true;
    }

    return (
        (left?.id ?? null) === (right?.id ?? null)
        && (left?.name ?? null) === (right?.name ?? null)
    );
}

function areProductSnapshotsEqual(left?: ProductSnapshot, right?: ProductSnapshot): boolean {
    if (!left || !right) {
        return left === right;
    }

    return (
        left.id === right.id
        && left.name === right.name
        && left.price === right.price
        && (left.imageUrl ?? null) === (right.imageUrl ?? null)
        && areProductFeaturesEqual(left.collection, right.collection)
        && (left.description ?? null) === (right.description ?? null)
        && (left.sku ?? null) === (right.sku ?? null)
        && (left.stockQuantity ?? null) === (right.stockQuantity ?? null)
        && (left.status ?? null) === (right.status ?? null)
        && left.href === right.href
        && (left.categoryCode ?? null) === (right.categoryCode ?? null)
        && (left.categoryName ?? null) === (right.categoryName ?? null)
        && (left.brandId ?? null) === (right.brandId ?? null)
        && (left.brandName ?? null) === (right.brandName ?? null)
        && (left.ratingAverage ?? null) === (right.ratingAverage ?? null)
        && (left.ratingCount ?? 0) === (right.ratingCount ?? 0)
    );
}

function normalizeFavoriteItem(value: unknown, fallbackId?: string): FavoriteStoreItem | null {
    const record = asRecord(value);
    const productId = toProductId(record?.productId ?? record?.id ?? fallbackId);

    if (!productId) {
        return null;
    }

    return {
        productId,
        snapshot: normalizeSnapshot(record?.snapshot ?? record),
        updatedAt: normalizeTimestamp(record?.updatedAt),
    };
}

function normalizeCartItem(value: unknown, fallbackId?: string): CartStoreItem | null {
    const record = asRecord(value);
    const productId = toProductId(record?.productId ?? record?.id ?? fallbackId);
    const quantity = Math.max(1, Number(record?.quantity ?? 1));

    if (!productId || !Number.isFinite(quantity)) {
        return null;
    }

    return {
        productId,
        quantity,
        snapshot: normalizeSnapshot(record?.snapshot ?? record),
        updatedAt: normalizeTimestamp(record?.updatedAt),
    };
}

function normalizeFavoriteStore(value: unknown): FavoriteStore {
    const next: FavoriteStore = {};

    if (Array.isArray(value)) {
        value.forEach((item) => {
            const normalized = typeof item === "number"
                ? normalizeFavoriteItem({productId: item})
                : normalizeFavoriteItem(item);

            if (normalized) {
                next[getProductIdKey(normalized.productId)] = normalized;
            }
        });
        return next;
    }

    const record = asRecord(value);
    if (!record) {
        return next;
    }

    Object.entries(record).forEach(([key, item]) => {
        const normalized = normalizeFavoriteItem(item, key);
        if (normalized) {
            next[getProductIdKey(normalized.productId)] = normalized;
        }
    });

    return next;
}

function normalizeCartStore(value: unknown): CartStore {
    const next: CartStore = {};

    if (Array.isArray(value)) {
        value.forEach((item) => {
            const normalized = typeof item === "number"
                ? normalizeCartItem({productId: item, quantity: 1})
                : normalizeCartItem(item);

            if (normalized) {
                next[getProductIdKey(normalized.productId)] = normalized;
            }
        });
        return next;
    }

    const record = asRecord(value);
    if (!record) {
        return next;
    }

    Object.entries(record).forEach(([key, item]) => {
        const normalized = normalizeCartItem(item, key);
        if (normalized) {
            next[getProductIdKey(normalized.productId)] = normalized;
        }
    });

    return next;
}

function readFavoritesFromStorage(): FavoriteStore {
    return normalizeFavoriteStore(parseStoredValue(FAVORITES_STORAGE_KEY));
}

function readCartFromStorage(): CartStore {
    return normalizeCartStore(parseStoredValue(CART_STORAGE_KEY));
}

function getFavoritesSnapshot(): FavoriteStore {
    if (!isBrowser()) {
        return EMPTY_FAVORITES;
    }

    if (!favoritesHydrated) {
        favoritesCache = readFavoritesFromStorage();
        favoritesHydrated = true;
    }

    return favoritesCache;
}

function getCartSnapshot(): CartStore {
    if (!isBrowser()) {
        return EMPTY_CART;
    }

    if (!cartHydrated) {
        cartCache = readCartFromStorage();
        cartHydrated = true;
    }

    return cartCache;
}

function getServerFavoritesSnapshot(): FavoriteStore {
    return EMPTY_FAVORITES;
}

function getServerCartSnapshot(): CartStore {
    return EMPTY_CART;
}

function writeFavorites(next: FavoriteStore): boolean {
    if (!persistStoredValue(FAVORITES_STORAGE_KEY, next)) {
        return false;
    }

    favoritesCache = next;
    favoritesHydrated = true;
    dispatchStoreChange(FAVORITES_CHANGE_EVENT);
    return true;
}

function writeCart(next: CartStore): boolean {
    if (!persistStoredValue(CART_STORAGE_KEY, next)) {
        return false;
    }

    cartCache = next;
    cartHydrated = true;
    dispatchStoreChange(CART_CHANGE_EVENT);
    return true;
}

function subscribeToFavorites(listener: () => void) {
    if (!isBrowser()) {
        return () => undefined;
    }

    const handleLocalChange = () => listener();
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== FAVORITES_STORAGE_KEY) {
            return;
        }

        favoritesCache = normalizeFavoriteStore(parseStorageEventValue(event.newValue));
        favoritesHydrated = true;
        listener();
    };

    window.addEventListener(FAVORITES_CHANGE_EVENT, handleLocalChange);
    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener(FAVORITES_CHANGE_EVENT, handleLocalChange);
        window.removeEventListener("storage", handleStorage);
    };
}

function subscribeToCart(listener: () => void) {
    if (!isBrowser()) {
        return () => undefined;
    }

    const handleLocalChange = () => listener();
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== CART_STORAGE_KEY) {
            return;
        }

        cartCache = normalizeCartStore(parseStorageEventValue(event.newValue));
        cartHydrated = true;
        listener();
    };

    window.addEventListener(CART_CHANGE_EVENT, handleLocalChange);
    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener(CART_CHANGE_EVENT, handleLocalChange);
        window.removeEventListener("storage", handleStorage);
    };
}

export function createProductSnapshot(product: ProductSnapshotInput): ProductSnapshot {
    const description = typeof product.description === "string"
        ? product.description
        : product.description?.shortText ?? product.description?.title ?? null;

    const mainImage = product.images?.find((image) => typeof image !== "string" && image.isMain)
        ?? product.images?.[0];
    const mainImageUrl = typeof mainImage === "string" ? mainImage : mainImage?.url;

    return {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl ?? product.img ?? mainImageUrl ?? null,
        collection: product.collection ?? null,
        description,
        sku: product.sku ?? null,
        stockQuantity: product.stockQuantity ?? null,
        status: product.status ?? null,
        href: product.href ?? product.link ?? routes.product(product.id),
        categoryCode: product.category?.code ?? null,
        categoryName: product.category?.name ?? null,
        brandId: product.brand?.id ?? null,
        brandName: product.brand?.name ?? null,
        ratingAverage: product.ratingAverage ?? null,
        ratingCount: product.ratingCount ?? 0,
    };
}

export function createProductSnapshotFromBatchSummary(product: IProductBatchSummaryItem): ProductSnapshot {
    return createProductSnapshot({
        ...product,
        category: product.categoryCode
            ? {id: 0, code: product.categoryCode, name: product.categoryName ?? product.categoryCode, parentId: null}
            : null,
        brand: product.brand ? {...product.brand, country: null} : null,
    });
}

export function markProductSnapshotUnavailable(snapshot: ProductSnapshot): ProductSnapshot {
    return {...snapshot, stockQuantity: 0, status: "UNAVAILABLE"};
}

export function isProductUnavailable(product: Pick<ProductSnapshot, "stockQuantity" | "status">): boolean {
    const availableStock = getAvailableStock(product);

    return (
        (product.status != null && product.status.toUpperCase() !== "ACTIVE")
        || (availableStock != null && availableStock <= 0)
    );
}

export function getAvailableStock(product: Pick<ProductSnapshot, "stockQuantity">): number | null {
    if (product.stockQuantity == null) {
        return null;
    }

    const stockQuantity = Number(product.stockQuantity);

    if (!Number.isFinite(stockQuantity)) {
        return null;
    }

    return Math.max(0, Math.floor(stockQuantity));
}

export function isStockLimitReached(
    product: Pick<ProductSnapshot, "stockQuantity">,
    quantity: number
): boolean {
    const availableStock = getAvailableStock(product);

    return availableStock != null && availableStock > 0 && quantity >= availableStock;
}

export function canIncreaseCartItem(
    product: Pick<ProductSnapshot, "stockQuantity" | "status">,
    quantity: number
): boolean {
    if (isProductUnavailable(product)) {
        return false;
    }

    return !isStockLimitReached(product, quantity);
}

function clampQuantityToAvailableStock(quantity: number, snapshot?: ProductSnapshot): number {
    if (!snapshot) {
        return quantity;
    }

    const availableStock = getAvailableStock(snapshot);

    if (availableStock == null || availableStock <= 0) {
        return quantity;
    }

    return Math.min(quantity, availableStock);
}

export function addFavoriteProduct(snapshot: ProductSnapshot): StorageMutationResult {
    const key = getProductIdKey(snapshot.id);
    const next = {
        ...getFavoritesSnapshot(),
        [key]: {
            productId: snapshot.id,
            snapshot,
            updatedAt: Date.now(),
        },
    };

    if (!writeFavorites(next)) {
        return {ok: false, status: "failed", isFavorite: Boolean(getFavoritesSnapshot()[key])};
    }

    return {ok: true, status: "added", isFavorite: true};
}

export function removeFavoriteProduct(productId: number): StorageMutationResult {
    const key = getProductIdKey(productId);
    const store = getFavoritesSnapshot();

    if (!store[key]) {
        return {ok: true, status: "noop", isFavorite: false};
    }

    const next = {...store};
    delete next[key];

    if (!writeFavorites(next)) {
        return {ok: false, status: "failed", isFavorite: true};
    }

    return {ok: true, status: "removed", isFavorite: false};
}

export function toggleFavoriteProduct(snapshot: ProductSnapshot): StorageMutationResult {
    const key = getProductIdKey(snapshot.id);

    if (getFavoritesSnapshot()[key]) {
        return removeFavoriteProduct(snapshot.id);
    }

    return addFavoriteProduct(snapshot);
}

export function updateFavoriteProductSnapshot(snapshot: ProductSnapshot) {
    const key = getProductIdKey(snapshot.id);
    const store = getFavoritesSnapshot();
    const current = store[key];

    if (!current) {
        return;
    }

    if (areProductSnapshotsEqual(current.snapshot, snapshot)) {
        return;
    }

    if (!writeFavorites({
        ...store,
        [key]: {
            ...current,
            snapshot,
        },
    })) {
        debugLocalProductStorage("Vympel favorite snapshot refresh failed.", {productId: snapshot.id});
    }
}

export function addCartProduct(
    snapshot: ProductSnapshot,
    quantity = 1,
    options: AddCartProductOptions = {}
): StorageMutationResult {
    if (isProductUnavailable(snapshot)) {
        return {ok: false, status: "unavailable"};
    }

    const key = getProductIdKey(snapshot.id);
    const store = getCartSnapshot();
    const current = store[key];
    const previousQuantity = current?.quantity ?? 0;
    const incrementQuantity = Math.max(1, quantity);

    if (current && options.incrementExisting === false) {
        return {
            ok: true,
            status: "alreadyInCart",
            quantity: current.quantity,
            previousQuantity,
        };
    }

    const availableStock = getAvailableStock(snapshot);

    if (availableStock != null && previousQuantity + incrementQuantity > availableStock) {
        return {
            ok: false,
            status: "stockLimit",
            quantity: previousQuantity,
            previousQuantity,
        };
    }

    const nextQuantity = previousQuantity + incrementQuantity;

    if (!writeCart({
        ...store,
        [key]: {
            productId: snapshot.id,
            quantity: nextQuantity,
            snapshot,
            updatedAt: Date.now(),
        },
    })) {
        return {
            ok: false,
            status: "failed",
            quantity: previousQuantity,
            previousQuantity,
        };
    }

    return {
        ok: true,
        status: current ? "updated" : "added",
        quantity: nextQuantity,
        previousQuantity,
    };
}

export function decrementCartProduct(productId: number): StorageMutationResult {
    const key = getProductIdKey(productId);
    const current = getCartSnapshot()[key];

    if (!current) {
        return {ok: true, status: "noop"};
    }

    if (current.quantity <= 1) {
        return removeCartProduct(productId);
    }

    const nextQuantity = current.quantity - 1;

    if (!writeCart({
        ...getCartSnapshot(),
        [key]: {
            ...current,
            quantity: nextQuantity,
            updatedAt: Date.now(),
        },
    })) {
        return {
            ok: false,
            status: "failed",
            quantity: current.quantity,
            previousQuantity: current.quantity,
        };
    }

    return {
        ok: true,
        status: "decremented",
        quantity: nextQuantity,
        previousQuantity: current.quantity,
    };
}

export function removeCartProduct(productId: number): StorageMutationResult {
    const key = getProductIdKey(productId);
    const store = getCartSnapshot();
    const current = store[key];

    if (!current) {
        return {ok: true, status: "noop"};
    }

    const next = {...store};
    delete next[key];

    if (!writeCart(next)) {
        return {
            ok: false,
            status: "failed",
            quantity: current.quantity,
            previousQuantity: current.quantity,
        };
    }

    return {
        ok: true,
        status: "removed",
        previousQuantity: current.quantity,
    };
}

export function clearCartProducts(): StorageMutationResult {
    const store = getCartSnapshot();

    if (Object.keys(store).length === 0) {
        return {ok: true, status: "noop"};
    }

    if (!writeCart({})) {
        return {ok: false, status: "failed"};
    }

    return {ok: true, status: "cleared"};
}

export function updateCartProductSnapshot(snapshot: ProductSnapshot) {
    const key = getProductIdKey(snapshot.id);
    const store = getCartSnapshot();
    const current = store[key];

    if (!current) {
        return;
    }

    const nextQuantity = clampQuantityToAvailableStock(current.quantity, snapshot);

    if (areProductSnapshotsEqual(current.snapshot, snapshot) && nextQuantity === current.quantity) {
        return;
    }

    if (!writeCart({
        ...store,
        [key]: {
            ...current,
            quantity: nextQuantity,
            snapshot,
        },
    })) {
        debugLocalProductStorage("Vympel cart snapshot refresh failed.", {productId: snapshot.id});
    }
}

export function useFavorites() {
    const store = useSyncExternalStore(
        subscribeToFavorites,
        getFavoritesSnapshot,
        getServerFavoritesSnapshot
    );

    const items = useMemo(
        () => Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt),
        [store]
    );

    const isFavorite = useCallback((productId: number) => {
        return Boolean(store[getProductIdKey(productId)]);
    }, [store]);

    return {
        items,
        count: items.length,
        isFavorite,
        addFavorite: addFavoriteProduct,
        removeFavorite: removeFavoriteProduct,
        toggleFavorite: toggleFavoriteProduct,
        updateFavoriteSnapshot: updateFavoriteProductSnapshot,
    };
}

export function useFavoriteProduct(snapshot: ProductSnapshot) {
    const store = useSyncExternalStore(
        subscribeToFavorites,
        getFavoritesSnapshot,
        getServerFavoritesSnapshot
    );

    const isFavorite = Boolean(store[getProductIdKey(snapshot.id)]);

    useEffect(() => {
        if (isFavorite) {
            updateFavoriteProductSnapshot(snapshot);
        }
    }, [isFavorite, snapshot]);

    return {
        isFavorite,
        toggleFavorite: useCallback(() => toggleFavoriteProduct(snapshot), [snapshot]),
        addFavorite: useCallback(() => addFavoriteProduct(snapshot), [snapshot]),
        removeFavorite: useCallback(() => removeFavoriteProduct(snapshot.id), [snapshot.id]),
    };
}

export function useCartProduct(snapshot: ProductSnapshot) {
    const store = useSyncExternalStore(
        subscribeToCart,
        getCartSnapshot,
        getServerCartSnapshot
    );

    const key = getProductIdKey(snapshot.id);
    const item = store[key];
    const isInCart = Boolean(item);
    const quantity = item?.quantity ?? 0;

    useEffect(() => {
        if (isInCart) {
            updateCartProductSnapshot(snapshot);
        }
    }, [isInCart, snapshot]);

    return {
        item,
        isInCart,
        quantity,
        addItem: useCallback(
            (nextQuantity = 1, options?: AddCartProductOptions) => addCartProduct(snapshot, nextQuantity, options),
            [snapshot]
        ),
        removeItem: useCallback(() => removeCartProduct(snapshot.id), [snapshot.id]),
    };
}

export function useCart() {
    const store = useSyncExternalStore(
        subscribeToCart,
        getCartSnapshot,
        getServerCartSnapshot
    );

    const items = useMemo(
        () => Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt),
        [store]
    );

    const count = useMemo(
        () => items.reduce((total, item) => total + item.quantity, 0),
        [items]
    );

    return {
        items,
        count,
        addItem: addCartProduct,
        decrementItem: decrementCartProduct,
        removeItem: removeCartProduct,
        clearCart: clearCartProducts,
        updateItemSnapshot: updateCartProductSnapshot,
    };
}

export function useCartActions() {
    return {
        addItem: addCartProduct,
        decrementItem: decrementCartProduct,
        removeItem: removeCartProduct,
        clearCart: clearCartProducts,
    };
}
