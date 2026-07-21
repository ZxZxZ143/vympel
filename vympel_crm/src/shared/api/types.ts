export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
};

export type AuthResponse = {
  accessToken: string;
};

export type CrmUser = {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  enabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export type ManagedUser = CrmUser;

export type CrmRole = {
  code: string;
};

export type UserPayload = {
  email: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles: string[];
  enabled: boolean;
};

export type Feature = {
  id: number;
  name: string;
  code?: string;
  brandId?: number | null;
};

export type Category = {
  id: number;
  name: string;
  code: string;
  parentId: number | null;
};

export type ProductImage = {
  id: number;
  url: string;
  alt?: string | null;
  sortOrder: number;
  isMain: boolean;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  productName?: ProductNamePayload | null;
  model: string;
  price: number | null;
  stockQuantity: number | null;
  status: ProductStatus;
  productType: ProductType;
  category: Category | null;
  brand: (Feature & { country?: string[] | null }) | null;
  collection: Feature | null;
  images: ProductImage[];
  description: {
    shortText?: string | null;
    title?: string | null;
    content?: string | null;
  } | null;
  descriptionTranslations?: ProductDescriptionPayload | null;
  watchDetails: {
    productId: number;
    mechanism?: Feature | null;
    gender?: Feature | null;
    caseMaterial?: Feature | null;
    strapMaterial?: Feature | null;
    glassType?: Feature | null;
    caseSizeMm?: number | null;
    waterResistance?: string | null;
    stoneInlay?: Feature | null;
  } | null;
  interiorClockDetails?: {
    productId: number;
    productionCountry?: Feature | null;
    caseMaterial?: Feature | null;
    color?: Feature | null;
    style?: Feature | null;
    mechanismType?: Feature | null;
    powerType?: Feature | null;
    dimensions?: string | null;
    weightGrams?: number | null;
    warrantyMonths?: number | null;
  } | null;
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
  promotionMode?: ProductPromotionMode | null;
  promotionScore?: number | null;
  promotedUntil?: string | null;
  promotionUpdatedAt?: string | null;
};

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type ProductType = "WATCH" | "APPLE_CASE" | "ACCESSORY" | "WALL_CLOCK" | "FLOOR_CLOCK";

export type ProductPromotionMode = "NOT_PROMOTED" | "MANUAL" | "AUTO";

export type ProductReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";

export type ProductReviewAuthorType = "GUEST" | "USER";

export type CustomerRequestStatus = "NEW" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type CustomerRequest = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: CustomerRequestStatus;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  adminComment: string | null;
};

export type ProductReview = {
  id: number;
  productId: number;
  productName: string;
  productModel: string;
  productSku: string;
  rating: number;
  text: string | null;
  authorType: ProductReviewAuthorType;
  authorName: string | null;
  createdAt: string;
  status: ProductReviewStatus;
  moderatedAt: string | null;
  moderatedBy: string | null;
};

export type ProductNamePayload = {
  name_ru: string;
  name_en: string;
  name_kz: string;
};

export type ProductDescriptionPayload = {
  desc?: string;
  desc_ru: string;
  desc_en: string;
  desc_kz: string;
};

export type ProductPayload = {
  productName: ProductNamePayload;
  model: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  productType: ProductType;
  brandId: number;
  collectionId?: number | null;
  categoryId: number;
  description?: ProductDescriptionPayload | null;
  watchDetails?: {
    mechanismId?: number | null;
    genderId?: number | null;
    caseMaterialId?: number | null;
    strapMaterialId?: number | null;
    glassTypeId?: number | null;
    caseSizeMm?: number | null;
    waterResistance?: string | null;
    stoneInlayId?: number | null;
  };
  interiorClockDetails?: {
    productionCountryId?: number | null;
    caseMaterialId?: number | null;
    colorId?: number | null;
    styleId?: number | null;
    mechanismTypeId?: number | null;
    powerTypeId?: number | null;
    dimensions?: string | null;
    weightGrams?: number | null;
    warrantyMonths?: number | null;
  };
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
};

export type ProductBulkCommonPayload = {
  brandId: number;
  collectionId?: number | null;
  status: ProductStatus;
  productType: ProductType;
  description?: ProductDescriptionPayload | null;
  watchDetails?: ProductPayload["watchDetails"];
  interiorClockDetails?: ProductPayload["interiorClockDetails"];
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
};

export type ProductBulkRowPayload = {
  productName: ProductPayload["productName"];
  model: string;
  price: number;
  stockQuantity: number;
  brandId?: number | null;
  collectionId?: number | null;
  status?: ProductStatus | null;
  productType?: ProductType | null;
  description?: ProductDescriptionPayload | null;
  watchDetails?: Partial<NonNullable<ProductPayload["watchDetails"]>> | null;
  interiorClockDetails?: Partial<NonNullable<ProductPayload["interiorClockDetails"]>> | null;
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
};

export type ProductBulkCreatePayload = {
  categoryId: number;
  common: ProductBulkCommonPayload;
  rows: ProductBulkRowPayload[];
};

export type ProductBulkCreateResult = {
  createdCount: number;
  failedCount: number;
  createdProducts: {
    rowIndex: number;
    id: number;
    sku: string;
  }[];
  errors: {
    rowIndex: number;
    field: string;
    message: string;
  }[];
};

export type CollectionTranslationPayload = {
  name: string;
  description: string;
};

export type CollectionPayload = {
  brandId: number;
  translations: {
    ru: CollectionTranslationPayload;
    en: CollectionTranslationPayload;
    kz: CollectionTranslationPayload;
  };
};

export type CrmCollection = Feature & {
  brandId: number;
  brandName: string | null;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type References = {
  categories: Category[];
  brands: Feature[];
  collections: Feature[];
  mechanisms: Feature[];
  genders: Feature[];
  materials: Feature[];
  glassTypes: Feature[];
  stoneInlays: Feature[];
  countries: Feature[];
  interiorColors: Feature[];
  interiorStyles: Feature[];
  interiorMechanisms: Feature[];
  interiorPowerTypes: Feature[];
};

export type Activity = {
  id: number;
  actorUserId: number | null;
  actorEmail: string | null;
  actorRole: string | null;
  eventType: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type Dashboard = {
  totalProducts: number;
  activeProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  missingKaspiLinks: number;
  missingWildberriesLinks: number;
  pendingReviews: number;
  recentlyUpdatedProducts: Product[];
  recentActivities: Activity[];
};

export type ProductAnalyticsPeriod = "today" | "7d" | "30d" | "all";

export type ProductPopularityRow = {
  productId: number;
  sku: string;
  name: string;
  model: string;
  stockQuantity: number | null;
  status: ProductStatus;
  promotionMode: ProductPromotionMode;
  promotionScore: number;
  promotedUntil: string | null;
  views: number;
  favorites: number;
  cartAdditions: number;
  addToCartRate: number;
  promotionRecommended: boolean;
  recommendedPromotionScore: number;
  recommendationReasonCode: string | null;
};

export type ProductPopularityAnalytics = {
  period: ProductAnalyticsPeriod;
  generatedAt: string;
  summary: {
    views: number;
    favorites: number;
    cartAdditions: number;
    addToCartRate: number;
  };
  mostViewed: ProductPopularityRow[];
  mostFavorited: ProductPopularityRow[];
  mostAddedToCart: ProductPopularityRow[];
  lowDemand: ProductPopularityRow[];
  highInterest: ProductPopularityRow[];
  promotionRecommendations: ProductPopularityRow[];
};

export type CmsPageStatus = "ACTIVE" | "INACTIVE";

export type CmsBlockStatus = "DRAFT" | "PUBLISHED";

export type CmsBlockType =
  | "HERO_SLIDER"
  | "BANNER"
  | "TEXT_BLOCK"
  | "IMAGE_TEXT_BLOCK"
  | "LINK_CARD"
  | "MARKETPLACE_LINK"
  | "FOOTER_LINK_GROUP"
  | "CUSTOM_JSON";

export type CmsLinkType =
  | "INTERNAL_ROUTE"
  | "CATALOG_CATEGORY"
  | "CATALOG_FILTER"
  | "BRAND_PAGE"
  | "PRODUCT_PAGE"
  | "EXTERNAL_URL"
  | "NONE";

export type CmsLinkOpenBehavior = "SAME_TAB" | "NEW_TAB";

export type CmsMediaStorageType = "OBJECT_STORAGE" | "PUBLIC_PATH";

export type CmsTranslation = {
  lang: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  buttonText: string | null;
  altText: string | null;
  extraJson: string | null;
};

export type CmsMedia = {
  id: number;
  storageType: CmsMediaStorageType;
  publicUrl: string | null;
  url: string | null;
  originalFilename: string | null;
  contentType: string | null;
  sizeBytes: number;
  createdAt: string | null;
};

export type CmsPublicCacheRefresh = {
  contentSaved: boolean;
  attempted: boolean;
  refreshed: boolean;
  status:
    | "NOT_REQUIRED"
    | "SUCCESS"
    | "FAILED_RETRY_SCHEDULED"
    | "FAILED_NOT_CONFIGURED"
    | "FAILED_PERMANENT";
  message: string;
  requestId: string | null;
};

export type CmsBlock = {
  id: number;
  pageKey: string;
  blockKey: string;
  blockType: CmsBlockType;
  sortOrder: number;
  status: CmsBlockStatus;
  settingsJson: string | null;
  media: CmsMedia | null;
  mediaKz: CmsMedia | null;
  mediaEn: CmsMedia | null;
  mobileMedia: CmsMedia | null;
  mobileMediaKz: CmsMedia | null;
  mobileMediaEn: CmsMedia | null;
  linkType: CmsLinkType;
  linkTarget: string | null;
  linkOpenBehavior: CmsLinkOpenBehavior;
  translations: Record<string, CmsTranslation>;
  createdAt: string;
  updatedAt: string;
  publicCacheRefresh: CmsPublicCacheRefresh | null;
};

export type CmsPageSummary = {
  id: number;
  pageKey: string;
  title: string;
  status: CmsPageStatus;
  blockCount: number;
};

export type CmsPage = {
  id: number;
  pageKey: string;
  title: string;
  status: CmsPageStatus;
  blocks: CmsBlock[];
};

export type CmsTranslationPayload = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  buttonText?: string | null;
  altText?: string | null;
  extraJson?: string | null;
};

export type CmsBlockPayload = {
  pageKey: string;
  blockKey: string;
  blockType: CmsBlockType;
  sortOrder: number;
  status: CmsBlockStatus;
  settingsJson?: string | null;
  mediaId?: number | null;
  mediaKzId?: number | null;
  mediaEnId?: number | null;
  mobileMediaId?: number | null;
  mobileMediaKzId?: number | null;
  mobileMediaEnId?: number | null;
  linkType: CmsLinkType;
  linkTarget?: string | null;
  linkOpenBehavior: CmsLinkOpenBehavior;
  translations: Record<string, CmsTranslationPayload>;
};
