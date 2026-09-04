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

export type BrandFeature = Feature & {
  countryId: number;
  countryCode: string;
  countryName: string;
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

export type ProductModelVariant = {
  id: number;
  name: string;
  model: string;
  status: ProductStatus;
  mainImage?: ProductImage | null;
};

export type ProductModelVariantGroup = {
  model: string;
  total: number;
  truncated: boolean;
  variants: ProductModelVariant[];
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
    dialType?: Feature | null;
    dialMarking?: Feature | null;
    powerSource?: Feature | null;
    waterResistanceOption?: Feature | null;
    strapColor?: Feature | null;
    dialColor?: Feature | null;
    packageContents?: string | null;
    features: Feature[];
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
  accessoryDetails?: {
    productId: number;
    claspType?: string | null;
    caseMaterial?: Feature | null;
    insertMaterial?: Feature | null;
    hasInsert?: boolean | null;
    color?: Feature | null;
    length?: string | null;
  } | null;
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
  promotionMode?: ProductPromotionMode | null;
  promotionScore?: number | null;
  promotedUntil?: string | null;
  promotionUpdatedAt?: string | null;
  modelVariantGroup?: ProductModelVariantGroup | null;
};

export type ProductListItem = Pick<
  Product,
  "id" | "sku" | "name" | "model" | "price" | "stockQuantity" | "status" | "kaspiUrl" | "wildberriesUrl"
> & {
  modelVariantGroup?: ProductModelVariantGroup | null;
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
    dialTypeId?: number | null;
    dialMarkingId?: number | null;
    powerSourceId?: number | null;
    waterResistanceId?: number | null;
    strapColorId?: number | null;
    dialColorId?: number | null;
    packageContents?: string | null;
    featureIds?: number[] | null;
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
  accessoryDetails?: {
    claspType?: string | null;
    caseMaterialId?: number | null;
    insertMaterialId?: number | null;
    hasInsert?: boolean | null;
    colorId?: number | null;
    length?: string | null;
  };
  kaspiUrl?: string | null;
  wildberriesUrl?: string | null;
};

export type KaspiImportRequest = {
  url: string;
  categoryId: number;
};

export type KaspiImportCategoryProfile = "WRISTWATCH" | "INTERIOR_CLOCK" | "ACCESSORY" | "GENERIC";

export type KaspiImportResolution = "EXACT" | "NORMALIZED" | "ALIAS";

export type KaspiImportUnmappedReason =
  | "UNKNOWN_LABEL"
  | "UNSUPPORTED_FOR_CATEGORY"
  | "UNRESOLVED_VALUE"
  | "AMBIGUOUS_VALUE"
  | "INVALID_VALUE"
  | "BRAND_COUNTRY_MISMATCH"
  | "DUPLICATE_CONFLICT";

export type KaspiImportValues = {
  nameRu?: string | null;
  brandId?: number | null;
  model?: string | null;
  price?: number | null;
  descriptionRu?: string | null;
  kaspiUrl: string;
  watchDetails?: {
    mechanismId?: number | null;
    genderId?: number | null;
    caseMaterialId?: number | null;
    strapMaterialId?: number | null;
    glassTypeId?: number | null;
    caseSizeMm?: number | null;
    waterResistance?: string | null;
    stoneInlayId?: number | null;
    dialTypeId?: number | null;
    dialMarkingId?: number | null;
    powerSourceId?: number | null;
    waterResistanceId?: number | null;
    strapColorId?: number | null;
    dialColorId?: number | null;
    packageContents?: string | null;
    featureIds?: number[] | null;
  } | null;
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
  } | null;
  accessoryDetails?: {
    claspType?: string | null;
    caseMaterialId?: number | null;
    insertMaterialId?: number | null;
    hasInsert?: boolean | null;
    colorId?: number | null;
    length?: string | null;
  } | null;
};

export type KaspiImportMappedCharacteristic = {
  sourceLabel: string;
  sourceValue: string;
  targetField: string;
  resolvedValue: string;
  resolution: KaspiImportResolution;
};

export type KaspiImportMappedField = {
  targetField: string;
  resolvedValue: string;
};

export type KaspiImportUnmappedCharacteristic = {
  sourceLabel: string;
  sourceValue: string;
  reason: KaspiImportUnmappedReason;
};

export type KaspiImportUnresolvedCharacteristic = {
  sourceLabel: string;
  sourceValue: string;
  targetField: string;
  reason: Exclude<KaspiImportUnmappedReason, "UNKNOWN_LABEL" | "UNSUPPORTED_FOR_CATEGORY">;
};

export type KaspiImportPreview = {
  source: "KASPI";
  sourceUrl: string;
  categoryId: number;
  categoryProfile: KaspiImportCategoryProfile;
  values: KaspiImportValues;
  mappedFields: KaspiImportMappedField[];
  mappedCharacteristics: KaspiImportMappedCharacteristic[];
  unmappedCharacteristics: KaspiImportUnmappedCharacteristic[];
  unresolvedCharacteristics: KaspiImportUnresolvedCharacteristic[];
  warnings: string[];
};

export type ProductBulkCommonPayload = {
  brandId: number;
  collectionId?: number | null;
  status: ProductStatus;
  productType: ProductType;
  description?: ProductDescriptionPayload | null;
  watchDetails?: ProductPayload["watchDetails"];
  interiorClockDetails?: ProductPayload["interiorClockDetails"];
  accessoryDetails?: ProductPayload["accessoryDetails"];
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
  accessoryDetails?: Partial<NonNullable<ProductPayload["accessoryDetails"]>> | null;
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
  brands: BrandFeature[];
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
  watchDialTypes: Feature[];
  watchDialMarkings: Feature[];
  watchPowerSources: Feature[];
  watchWaterResistances: Feature[];
  watchFeatures: Feature[];
};

export type ReferenceCreateType =
  | "watch-mechanisms"
  | "genders"
  | "case-materials"
  | "strap-materials"
  | "glass-types"
  | "stone-inlays"
  | "colors"
  | "interior-styles"
  | "interior-mechanisms"
  | "interior-power-types"
  | "watch-dial-types"
  | "watch-dial-markings"
  | "watch-power-sources"
  | "watch-water-resistances"
  | "watch-features";

export type ReferenceCreatePayload = {
  ru: string;
  kz?: string;
  en?: string;
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
  | "INSTAGRAM_POST"
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
