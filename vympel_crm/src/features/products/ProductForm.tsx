/* eslint-disable @next/next/no-img-element -- CRM previews render dynamic MinIO and blob URLs. */
"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { CrmApiError, crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { CollectionPayload, CrmCollection, Feature, Product, ProductImage, ProductPayload, ProductStatus, ProductType, References } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { messages as localizedMessages } from "@/shared/i18n/messages";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field } from "@/shared/ui/Field";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { getCategoryProfile, productTypeForCategory } from "@/features/products/productCategoryProfile";
import { notifyProductListChanged } from "@/features/products/productListRefresh";

const statuses: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];
const productTypes: ProductType[] = ["WATCH", "APPLE_CASE", "ACCESSORY", "WALL_CLOCK", "FLOOR_CLOCK"];

type ProductFormProps = {
  productId?: number;
};

type ProductFormState = {
  nameRu: string;
  nameEn: string;
  nameKz: string;
  model: string;
  price: string;
  stockQuantity: string;
  status: ProductStatus;
  productType: ProductType;
  brandId: string;
  collectionId: string;
  categoryId: string;
  descriptionRu: string;
  descriptionEn: string;
  descriptionKz: string;
  mechanismId: string;
  genderId: string;
  caseMaterialId: string;
  strapMaterialId: string;
  glassTypeId: string;
  caseSizeMm: string;
  waterResistance: string;
  stoneInlayId: string;
  productionCountryId: string;
  interiorCaseMaterialId: string;
  interiorColorId: string;
  interiorStyleId: string;
  interiorMechanismTypeId: string;
  powerTypeId: string;
  dimensions: string;
  weightGrams: string;
  warrantyMonths: string;
  kaspiUrl: string;
  wildberriesUrl: string;
};

type CollectionFormState = {
  brandId: string;
  nameRu: string;
  nameEn: string;
  nameKz: string;
  descriptionRu: string;
  descriptionEn: string;
  descriptionKz: string;
};

const emptyForm: ProductFormState = {
  nameRu: "",
  nameEn: "",
  nameKz: "",
  model: "",
  price: "0",
  stockQuantity: "0",
  status: "DRAFT",
  productType: "WATCH",
  brandId: "",
  collectionId: "",
  categoryId: "",
  descriptionRu: "",
  descriptionEn: "",
  descriptionKz: "",
  mechanismId: "",
  genderId: "",
  caseMaterialId: "",
  strapMaterialId: "",
  glassTypeId: "",
  caseSizeMm: "",
  waterResistance: "",
  stoneInlayId: "",
  productionCountryId: "",
  interiorCaseMaterialId: "",
  interiorColorId: "",
  interiorStyleId: "",
  interiorMechanismTypeId: "",
  powerTypeId: "",
  dimensions: "",
  weightGrams: "",
  warrantyMonths: "",
  kaspiUrl: "",
  wildberriesUrl: "",
};

const emptyCollectionForm: CollectionFormState = {
  brandId: "",
  nameRu: "",
  nameEn: "",
  nameKz: "",
  descriptionRu: "",
  descriptionEn: "",
  descriptionKz: "",
};

const russianCharacteristicLabels: Record<string, string> = localizedMessages.ru.products.characteristicLabels;
const supportedImageExtensionsByType = new Map([
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/gif", new Set(["gif"])],
]);
const maxImageCount = 10;
const maxImageSizeBytes = 10 * 1024 * 1024;

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const { locale, t, messages } = useI18n();
  const [references, setReferences] = useState<References | null>(null);
  const {
    control: productControl,
    handleSubmit,
    reset: resetProductForm,
    setValue: setProductValue,
  } = useForm<ProductFormState>({
    defaultValues: emptyForm,
  });
  const form = (useWatch({ control: productControl }) ?? emptyForm) as ProductFormState;
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [persistedStatus, setPersistedStatus] = useState<ProductStatus>("DRAFT");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoAction, setPhotoAction] = useState<string | null>(null);
  const [imagePendingDeleteId, setImagePendingDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const {
    control: collectionControl,
    handleSubmit: handleCollectionSubmit,
    reset: resetCollectionForm,
    setValue: setCollectionValue,
  } = useForm<CollectionFormState>({
    defaultValues: emptyCollectionForm,
  });
  const collectionForm = (useWatch({ control: collectionControl }) ?? emptyCollectionForm) as CollectionFormState;
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [collectionSuccess, setCollectionSuccess] = useState<string | null>(null);
  const isEdit = productId !== undefined;
  const selectedImagePreviews = useMemo(
    () => selectedImages.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [selectedImages]
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedImagePreviews]);

  useEffect(() => {
    let alive = true;

    Promise.all([
      crmApi.references(locale),
      productId === undefined ? Promise.resolve(null) : crmApi.product(productId, locale),
    ])
      .then(([nextReferences, product]) => {
        if (!alive) {
          return;
        }

        setReferences(nextReferences);
        setError(null);
        if (product) {
          resetProductForm(productToForm(product));
          setExistingImages(product.images ?? []);
          setPersistedStatus(product.status);
        } else {
          setExistingImages([]);
          setPersistedStatus("DRAFT");
        }
      })
      .catch(() => setError(t("common.error")))
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [locale, productId, resetProductForm, t]);

  const updateField = <Field extends keyof ProductFormState>(field: Field, value: ProductFormState[Field]) => {
    const next = { ...form, [field]: value };

    if (field === "brandId" && form.brandId !== value) {
      next.collectionId = "";
    }

    if (field === "categoryId" && references) {
      const currentProfile = getCategoryProfile(references.categories, form.categoryId);
      const nextProfile = getCategoryProfile(references.categories, value);

      next.productType = productTypeForCategory(references.categories, value);

      if (currentProfile !== nextProfile) {
        clearCategoryDetailFields(next);
      }
    }

    if (field === "brandId" || field === "categoryId") {
      resetProductForm(next, { keepDirty: true });
    } else {
      setProductValue(field, value as never, { shouldDirty: true });
    }

    if (field === "brandId") {
      setCollectionValue("brandId", value);
      setCollectionSuccess(null);
      setCollectionError(null);
    }
  };

  const updateCollectionField = <Field extends keyof CollectionFormState>(field: Field, value: CollectionFormState[Field]) => {
    setCollectionValue(field, value as never, { shouldDirty: true });
    setCollectionSuccess(null);
    setCollectionError(null);
  };

  const toggleCollectionForm = () => {
    if (!collectionForm.brandId) {
      setCollectionValue("brandId", form.brandId);
    }
    setCollectionFormOpen((current) => !current);
    setCollectionError(null);
    setCollectionSuccess(null);
  };

  const createCollection = async (values: CollectionFormState) => {
    if (collectionSaving) {
      return;
    }

    const validationError = validateCollectionForm(values, t);

    if (validationError) {
      setCollectionError(validationError);
      return;
    }

    setCollectionSaving(true);
    setCollectionError(null);
    setCollectionSuccess(null);

    try {
      const collection = await crmApi.createCollection(toCollectionPayload(values), locale);
      const option = collectionToOption(collection);

      setReferences((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          collections: mergeCollectionOption(current.collections, option),
        };
      });
      resetProductForm({
        ...form,
        brandId: String(collection.brandId),
        collectionId: String(collection.id),
      }, { keepDirty: true });
      resetCollectionForm({ ...emptyCollectionForm, brandId: String(collection.brandId) });
      setCollectionSuccess(t("products.collectionCreated"));
      notifications.success(t("products.collectionCreated"));
      setCollectionFormOpen(false);
    } catch (error) {
      const message = getCrmErrorMessage(error, t("products.collectionCreateError"));
      setCollectionError(message);
      notifications.error(message);
    } finally {
      setCollectionSaving(false);
    }
  };

  const submit = async (values: ProductFormState) => {
    if (saving || photoUploading || photoAction) {
      return;
    }

    const validationError = validateForm(values, t);

    if (validationError) {
      setError(validationError);
      return;
    }

    const wantsActivation = values.status === "ACTIVE";
    const hasPersistedMainImage = existingImages.some((image) => image.isMain && image.sortOrder === 0);
    if (wantsActivation && !hasPersistedMainImage && selectedImages.length === 0) {
      setError(t("products.activeRequiresMainImage"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const deferActivation = wantsActivation && !hasPersistedMainImage;
      const payload = {
        ...toPayload(values, references?.categories ?? []),
        status: deferActivation ? "DRAFT" as const : values.status,
      };
      let savedProduct: Product;
      if (isEdit) {
        savedProduct = await crmApi.updateProduct(productId, payload, locale);
      } else {
        savedProduct = await crmApi.createProduct(payload, locale);
      }
      setPersistedStatus(savedProduct.status);
      notifyProductListChanged();

      if (selectedImages.length > 0) {
        setPhotoUploading(true);
        try {
          const productWithImages = await crmApi.uploadProductImages(savedProduct.id, selectedImages, locale);
          setExistingImages(productWithImages.images ?? []);
          setSelectedImages([]);
          setPhotoInputKey((current) => current + 1);
          setPhotoError(null);
          notifications.success(t("products.photosUploaded"));
          notifyProductListChanged();
        } catch (error) {
          const message = getPhotoUploadErrorMessage(error, t);
          setPhotoError(message);
          notifications.success(isEdit ? t("products.updated") : t("products.created"));
          notifications.error(message);
          if (!isEdit) {
            router.push(`/products/${savedProduct.id}`);
          }
          return;
        } finally {
          setPhotoUploading(false);
        }
      }

      if (deferActivation) {
        savedProduct = await crmApi.updateStatus(savedProduct.id, "ACTIVE", locale);
        setPersistedStatus(savedProduct.status);
        setExistingImages(savedProduct.images ?? []);
        notifyProductListChanged();
      }

      notifications.success(isEdit ? t("products.updated") : t("products.created"));
      router.push(isEdit ? "/products" : `/products/${savedProduct.id}`);
    } catch (error) {
      const message = getCrmErrorMessage(
        error,
        isEdit ? t("products.updateError") : t("products.createError"),
        t("products.validationError"),
        {
          PRODUCT_MAIN_IMAGE_REQUIRED: t("products.activeRequiresMainImage"),
          PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN: t("products.finalActiveImageDeleteBlocked"),
        }
      );
      setError(message);
      notifications.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validationError = validateSelectedImages(files, t);

    if (validationError) {
      event.target.value = "";
      setSelectedImages([]);
      setPhotoError(validationError);
      notifications.error(validationError);
      return;
    }

    setSelectedImages(files);
    setPhotoError(null);
  };

  const clearSelectedImages = () => {
    setSelectedImages([]);
    setPhotoInputKey((current) => current + 1);
    setPhotoError(null);
  };

  const selectCategoryForCreate = () => {
    if (!references || !pendingCategoryId) {
      setError(t("products.categoryFirstError"));
      return;
    }

    resetProductForm(withSelectedCategory(form, references.categories, pendingCategoryId), { keepDirty: true });
    setError(null);
  };

  const resetCreateCategory = () => {
    setPendingCategoryId(form.categoryId);
    resetProductForm(clearCategoryDetailFields({ ...form, categoryId: "" }), { keepDirty: true });
    setError(null);
  };

  const uploadSelectedImages = async () => {
    if (!isEdit || photoUploading || photoAction || saving) {
      return;
    }

    const validationError = validateSelectedImages(selectedImages, t);

    if (validationError) {
      setPhotoError(validationError);
      notifications.error(validationError);
      return;
    }

    setPhotoUploading(true);
    setPhotoError(null);

    try {
      const productWithImages = await crmApi.uploadProductImages(productId, selectedImages, locale);
      setExistingImages(productWithImages.images ?? []);
      setSelectedImages([]);
      setPhotoInputKey((current) => current + 1);
      notifications.success(t("products.photosUploaded"));
      notifyProductListChanged();
    } catch (error) {
      const message = getPhotoUploadErrorMessage(error, t);
      setPhotoError(message);
      notifications.error(message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const moveImage = async (imageId: number, direction: -1 | 1) => {
    if (!isEdit || photoAction || photoUploading || saving) {
      return;
    }

    const currentIndex = existingImages.findIndex((image) => image.id === imageId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= existingImages.length) {
      return;
    }

    const reordered = [...existingImages];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    setPhotoAction(`order-${imageId}`);
    setPhotoError(null);

    try {
      const product = await crmApi.reorderProductImages(productId, reordered.map((image) => image.id), locale);
      setExistingImages(product.images ?? []);
      notifications.success(t("products.photosOrderSaved"));
      notifyProductListChanged();
    } catch (error) {
      const message = getCrmErrorMessage(error, t("products.photosOrderError"), undefined, {
        PRODUCT_MEDIA_POSITION_CONFLICT: t("products.photosOrderError"),
        PRODUCT_MAIN_IMAGE_CONFLICT: t("products.photosOrderError"),
      });
      setPhotoError(message);
      notifications.error(message);
    } finally {
      setPhotoAction(null);
    }
  };

  const setMainImage = async (imageId: number) => {
    if (!isEdit || photoAction || photoUploading || saving) {
      return;
    }

    setPhotoAction(`main-${imageId}`);
    setPhotoError(null);

    try {
      const product = await crmApi.setMainProductImage(productId, imageId, locale);
      setExistingImages(product.images ?? []);
      notifications.success(t("products.photosMainUpdated"));
      notifyProductListChanged();
    } catch (error) {
      const message = getCrmErrorMessage(error, t("products.photosMainError"), undefined, {
        PRODUCT_MAIN_IMAGE_CONFLICT: t("products.photosMainError"),
      });
      setPhotoError(message);
      notifications.error(message);
    } finally {
      setPhotoAction(null);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!isEdit || photoAction || photoUploading || saving) {
      return;
    }
    if (persistedStatus === "ACTIVE" && existingImages.length === 1) {
      const message = t("products.finalActiveImageDeleteBlocked");
      setPhotoError(message);
      notifications.error(message);
      return;
    }

    setPhotoAction(`delete-${imageId}`);
    setPhotoError(null);

    try {
      const product = await crmApi.deleteProductImage(productId, imageId, locale);
      setExistingImages(product.images ?? []);
      notifications.success(t("products.photosDeleteSuccess"));
      notifyProductListChanged();
    } catch (error) {
      const message = getCrmErrorMessage(error, t("products.photosDeleteError"), undefined, {
        PRODUCT_FINAL_IMAGE_DELETE_FORBIDDEN: t("products.finalActiveImageDeleteBlocked"),
      });
      setPhotoError(message);
      notifications.error(message);
    } finally {
      setPhotoAction(null);
    }
  };

  const confirmDeleteImage = async () => {
    if (imagePendingDeleteId === null) return;

    await deleteImage(imagePendingDeleteId);
    setImagePendingDeleteId(null);
  };

  if (loading || !references) {
    return <Text tone="muted">{t("common.loading")}</Text>;
  }

  if (!isEdit && !form.categoryId) {
    return (
      <CategorySelectionStep
        references={references}
        pendingCategoryId={pendingCategoryId}
        error={error}
        t={t}
        onPendingCategoryChange={(value) => {
          setPendingCategoryId(value);
          setError(null);
        }}
        onContinue={selectCategoryForCreate}
      />
    );
  }

  const visibleCollections = references.collections.filter((collection) => {
    if (!form.brandId || collection.brandId === undefined || collection.brandId === null) {
      return true;
    }

    return String(collection.brandId) === form.brandId;
  });
  const categoryProfile = getCategoryProfile(references.categories, form.categoryId);
  const isWristwatchCategory = categoryProfile === "wristwatch";
  const isInteriorClockCategory = categoryProfile === "interior";
  const showNoCategorySpecsHint = categoryProfile === "accessory" || categoryProfile === "generic";

  return (
    <section className="crm-page">
      <Text tone="muted">{t("products.subtitle")}</Text>

      {error && <Text className="crm-form-error">{error}</Text>}

      <form className="crm-page" onSubmit={handleSubmit(submit)}>
        <FormPanel title={t("products.namesSection")}>
          <Text tone="muted" size="small">{t("products.translationOptionalHint")}</Text>
          <div className="crm-grid crm-grid--form">
            <TextField id="nameRu" label={t("products.nameRu")} value={form.nameRu} maxLength={255} onChange={(value) => updateField("nameRu", value)} />
            <TextField id="nameEn" label={t("products.nameEn")} value={form.nameEn} maxLength={255} onChange={(value) => updateField("nameEn", value)} />
            <TextField id="nameKz" label={t("products.nameKz")} value={form.nameKz} maxLength={255} onChange={(value) => updateField("nameKz", value)} />
          </div>
        </FormPanel>

        <FormPanel title={t("products.coreSection")}>
          <div className="crm-grid crm-grid--form">
            <TextField id="model" label={t("products.model")} value={form.model} maxLength={255} onChange={(value) => updateField("model", value)} />
            <NumberField id="price" label={t("products.price")} value={form.price} onChange={(value) => updateField("price", value)} />
            <NumberField id="stockQuantity" label={t("products.stockQuantity")} value={form.stockQuantity} onChange={(value) => updateField("stockQuantity", value)} />
            <SelectField id="status" label={t("products.status")} value={form.status} onChange={(value) => updateField("status", value as ProductStatus)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {messages.products.statuses[status]}
                </option>
              ))}
            </SelectField>
            <Text tone="muted" size="small">{t("products.activeRequiresMainImage")}</Text>
            <SelectField id="productType" label={t("products.productType")} value={form.productType} onChange={(value) => updateField("productType", value as ProductType)}>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {messages.products.types[type]}
                </option>
              ))}
            </SelectField>
            <ReferenceSelect id="brandId" label={t("products.brand")} value={form.brandId} options={references.brands} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("brandId", value)} />
            <ReferenceSelect id="categoryId" label={t("products.category")} value={form.categoryId} options={references.categories} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("categoryId", value)} disabled />
            <ReferenceSelect id="collectionId" label={t("products.collection")} value={form.collectionId} options={visibleCollections} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("collectionId", value)} optional />
          </div>

          <div className="crm-form-section">
            <div className="crm-form-section__header">
              <Text as="span" size="small" tone="muted">
                {isEdit ? t("products.categoryLockedHint") : t("products.categoryChangeHint")}
              </Text>
              {!isEdit && (
                <Button type="button" variant="secondary" onClick={resetCreateCategory}>
                  {t("products.categoryChange")}
                </Button>
              )}
            </div>
          </div>

          <div className="crm-form-section">
            <div className="crm-form-section__header">
              <Text as="span" size="small" tone="muted">
                {t("products.collectionCreateHint")}
              </Text>
              <Button type="button" variant="secondary" onClick={toggleCollectionForm}>
                {collectionFormOpen ? t("products.collectionCreateClose") : t("products.collectionCreateOpen")}
              </Button>
            </div>

            {collectionError && <Text className="crm-form-error">{collectionError}</Text>}
            {collectionSuccess && <Text className="crm-form-success">{collectionSuccess}</Text>}

            {collectionFormOpen && (
              <div className="crm-form-section__body">
                <div className="crm-grid crm-grid--form">
                  <ReferenceSelect id="collectionBrandId" label={t("products.collectionBrand")} value={collectionForm.brandId} options={references.brands} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCollectionField("brandId", value)} />
                  <TextField id="collectionNameRu" label={t("products.collectionNameRu")} value={collectionForm.nameRu} onChange={(value) => updateCollectionField("nameRu", value)} />
                  <TextField id="collectionNameEn" label={t("products.collectionNameEn")} value={collectionForm.nameEn} onChange={(value) => updateCollectionField("nameEn", value)} />
                  <TextField id="collectionNameKz" label={t("products.collectionNameKz")} value={collectionForm.nameKz} onChange={(value) => updateCollectionField("nameKz", value)} />
                  <TextAreaField id="collectionDescriptionRu" label={t("products.collectionDescriptionRu")} value={collectionForm.descriptionRu} onChange={(value) => updateCollectionField("descriptionRu", value)} />
                  <TextAreaField id="collectionDescriptionEn" label={t("products.collectionDescriptionEn")} value={collectionForm.descriptionEn} onChange={(value) => updateCollectionField("descriptionEn", value)} />
                  <TextAreaField id="collectionDescriptionKz" label={t("products.collectionDescriptionKz")} value={collectionForm.descriptionKz} onChange={(value) => updateCollectionField("descriptionKz", value)} />
                </div>
                <div className="crm-inline-actions">
                  <Button type="button" isLoading={collectionSaving} onClick={() => void handleCollectionSubmit(createCollection)()}>
                    {collectionSaving ? t("common.loading") : t("products.collectionCreateSubmit")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </FormPanel>

        <FormPanel title={t("products.descriptionSection")}>
          <Text tone="muted" size="small">{t("products.descriptionOptionalHint")}</Text>
          <div className="crm-grid crm-grid--form">
            <TextAreaField id="descriptionRu" label={t("products.descriptionRu")} value={form.descriptionRu} maxLength={10000} onChange={(value) => updateField("descriptionRu", value)} />
            <TextAreaField id="descriptionEn" label={t("products.descriptionEn")} value={form.descriptionEn} maxLength={10000} onChange={(value) => updateField("descriptionEn", value)} />
            <TextAreaField id="descriptionKz" label={t("products.descriptionKz")} value={form.descriptionKz} maxLength={10000} onChange={(value) => updateField("descriptionKz", value)} />
          </div>
        </FormPanel>

        <FormPanel title={t("products.specsSection")}>
          <Text tone="muted" size="small">{t("products.specsOptionalHint")}</Text>
          {isWristwatchCategory && (
            <div className="crm-grid crm-grid--form">
              <ReferenceSelect id="mechanismId" label={t("products.mechanism")} value={form.mechanismId} options={references.mechanisms} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("mechanismId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="genderId" label={t("products.gender")} value={form.genderId} options={references.genders} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("genderId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="caseMaterialId" label={t("products.caseMaterial")} value={form.caseMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("caseMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="strapMaterialId" label={t("products.strapMaterial")} value={form.strapMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("strapMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="glassTypeId" label={t("products.glassType")} value={form.glassTypeId} options={references.glassTypes} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("glassTypeId", value)} displayLabels={russianCharacteristicLabels} />
              <NumberField id="caseSizeMm" label={t("products.caseSizeMm")} value={form.caseSizeMm} onChange={(value) => updateField("caseSizeMm", value)} />
              <TextField id="waterResistance" label={t("products.waterResistance")} value={form.waterResistance} onChange={(value) => updateField("waterResistance", value)} />
              <ReferenceSelect id="stoneInlayId" label={t("products.stoneInlay")} value={form.stoneInlayId} options={references.stoneInlays} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("stoneInlayId", value)} displayLabels={russianCharacteristicLabels} optional />
            </div>
          )}

          {isInteriorClockCategory && (
            <div className="crm-grid crm-grid--form">
              <ReferenceSelect id="productionCountryId" label={t("products.productionCountry")} value={form.productionCountryId} options={references.countries} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("productionCountryId", value)} />
              <ReferenceSelect id="interiorCaseMaterialId" label={t("products.interiorCaseMaterial")} value={form.interiorCaseMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("interiorCaseMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="interiorColorId" label={t("products.interiorColor")} value={form.interiorColorId} options={references.interiorColors} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("interiorColorId", value)} />
              <ReferenceSelect id="interiorStyleId" label={t("products.interiorStyle")} value={form.interiorStyleId} options={references.interiorStyles} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("interiorStyleId", value)} optional />
              <ReferenceSelect id="interiorMechanismTypeId" label={t("products.interiorMechanismType")} value={form.interiorMechanismTypeId} options={references.interiorMechanisms} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("interiorMechanismTypeId", value)} />
              <ReferenceSelect id="powerTypeId" label={t("products.powerType")} value={form.powerTypeId} options={references.interiorPowerTypes} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateField("powerTypeId", value)} />
              <TextField id="dimensions" label={t("products.dimensions")} value={form.dimensions} onChange={(value) => updateField("dimensions", value)} />
              <NumberField id="weightGrams" label={t("products.weightGrams")} value={form.weightGrams} onChange={(value) => updateField("weightGrams", value)} />
              <NumberField id="warrantyMonths" label={t("products.warrantyMonths")} value={form.warrantyMonths} onChange={(value) => updateField("warrantyMonths", value)} />
            </div>
          )}

          {showNoCategorySpecsHint && (
            <Text tone="muted">{t("products.categorySpecsHint")}</Text>
          )}
        </FormPanel>

        <FormPanel title={t("products.linksSection")}>
          <div className="crm-grid crm-grid--form">
            <TextField id="kaspiUrl" label={t("products.kaspiUrl")} value={form.kaspiUrl} onChange={(value) => updateField("kaspiUrl", value)} />
            <TextField id="wildberriesUrl" label={t("products.wildberriesUrl")} value={form.wildberriesUrl} onChange={(value) => updateField("wildberriesUrl", value)} />
          </div>
        </FormPanel>

        <FormPanel title={t("products.photosSection")}>
          <div className="crm-grid">
            {existingImages.length > 0 ? (
              <>
                <Text tone="muted" size="small">{t("products.photosManageHint")}</Text>
                {persistedStatus === "ACTIVE" && existingImages.length === 1 ? (
                  <Text tone="muted" size="small">{t("products.finalActiveImageDeleteBlocked")}</Text>
                ) : null}
                <div className="crm-photo-grid">
                  {existingImages.map((image, index) => (
                    <div className="crm-photo-preview" key={image.id}>
                      <div className="crm-photo-preview__media">
                        <ProductPhotoPreview
                          image={image}
                          alt={`${t("products.photoPreviewAlt")} ${index + 1}`}
                          fallback={t("products.photosEmpty")}
                        />
                        {image.isMain ? <span className="crm-photo-preview__badge">{t("products.photosMain")}</span> : null}
                      </div>
                      <div className="crm-photo-preview__actions">
                        {!image.isMain ? (
                          <Button
                            type="button"
                            className="crm-button--compact"
                            variant="secondary"
                            isLoading={photoAction === `main-${image.id}`}
                            disabled={Boolean(photoAction) || photoUploading || saving}
                            onClick={() => void setMainImage(image.id)}
                          >
                            {t("products.photosMakeMain")}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          className="crm-button--compact"
                          variant="secondary"
                          isLoading={photoAction === `order-${image.id}`}
                          disabled={Boolean(photoAction) || photoUploading || saving || index === 0}
                          onClick={() => void moveImage(image.id, -1)}
                        >
                          {t("products.photosMoveUp")}
                        </Button>
                        <Button
                          type="button"
                          className="crm-button--compact"
                          variant="secondary"
                          isLoading={photoAction === `order-${image.id}`}
                          disabled={Boolean(photoAction) || photoUploading || saving || index === existingImages.length - 1}
                          onClick={() => void moveImage(image.id, 1)}
                        >
                          {t("products.photosMoveDown")}
                        </Button>
                        <Button
                          type="button"
                          className="crm-button--compact"
                          variant="danger"
                          isLoading={photoAction === `delete-${image.id}`}
                          disabled={Boolean(photoAction) || photoUploading || saving || (persistedStatus === "ACTIVE" && existingImages.length === 1)}
                          onClick={() => setImagePendingDeleteId(image.id)}
                        >
                          {t("products.photosDelete")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="crm-empty">
                <Text tone="muted">{t("products.photosEmpty")}</Text>
              </div>
            )}

            <Field htmlFor="productPhotos" label={t("products.photosSelect")}>
              <input
                key={photoInputKey}
                id="productPhotos"
                className="crm-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={photoUploading || Boolean(photoAction) || saving}
                onChange={updateSelectedImages}
              />
            </Field>

            {selectedImagePreviews.length > 0 ? (
              <div className="crm-grid">
                <Text tone="muted" size="small">
                  {isEdit ? t("products.photosReadyToUpload") : t("products.photosCreateHint")}
                </Text>
                <div className="crm-photo-grid">
                  {selectedImagePreviews.map((preview, index) => (
                    <div className="crm-photo-preview" key={preview.url}>
                      <img className="crm-photo-preview__image" src={preview.url} alt={`${t("products.photoSelectedAlt")} ${index + 1}`} />
                      <span className="crm-photo-preview__name">{preview.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Text tone="muted" size="small">
                {t("products.photosHelp")}
              </Text>
            )}

            {photoError && <Text className="crm-form-error">{photoError}</Text>}

            <div className="crm-inline-actions">
              <Button
                type="button"
                isLoading={photoUploading}
                disabled={!isEdit || selectedImages.length === 0 || Boolean(photoAction) || saving}
                onClick={uploadSelectedImages}
              >
                {photoUploading ? t("products.photosUploading") : t("products.photosUpload")}
              </Button>
              <Button type="button" variant="secondary" disabled={selectedImages.length === 0 || photoUploading || Boolean(photoAction) || saving} onClick={clearSelectedImages}>
                {t("products.photosClearSelected")}
              </Button>
            </div>
          </div>
        </FormPanel>

        <div className="crm-inline-actions">
          <Button type="submit" isLoading={saving || photoUploading || Boolean(photoAction)}>
            {saving || photoUploading || photoAction ? t("common.loading") : t("common.save")}
          </Button>
          <Button variant="secondary" disabled={saving || photoUploading || Boolean(photoAction)} onClick={() => router.push("/products")}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.cancel")}
        confirmLabel={t("products.photosDelete")}
        isLoading={imagePendingDeleteId !== null ? photoAction === `delete-${imagePendingDeleteId}` : false}
        open={imagePendingDeleteId !== null}
        title={t("products.photosDeleteConfirm")}
        onConfirm={confirmDeleteImage}
        onOpenChange={(open) => {
          if (!open && !photoAction) {
            setImagePendingDeleteId(null);
          }
        }}
      />
    </section>
  );
}

function ProductPhotoPreview({ image, alt, fallback }: { image: ProductImage; alt: string; fallback: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canRenderImage = Boolean(image.url) && failedUrl !== image.url;

  return canRenderImage ? (
    <img
      className="crm-photo-preview__image"
      src={image.url}
      alt={image.alt || alt}
      onError={() => setFailedUrl(image.url)}
    />
  ) : (
    <div className="crm-photo-preview__fallback">{fallback}</div>
  );
}

function getPhotoUploadErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof CrmApiError && error.code === "UPLOAD_TOO_LARGE") {
    return t("products.photosTooLargeError");
  }

  return t("products.photosUploadError");
}

function FormPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="crm-panel">
      <div className="crm-panel__header">
        <Heading as="h2" size="title">
          {title}
        </Heading>
      </div>
      <div className="crm-panel__body">{children}</div>
    </section>
  );
}

function CategorySelectionStep({
  references,
  pendingCategoryId,
  error,
  t,
  onPendingCategoryChange,
  onContinue,
}: {
  references: References;
  pendingCategoryId: string;
  error: string | null;
  t: (key: string) => string;
  onPendingCategoryChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <section className="crm-page">
      <Text tone="muted">{t("products.subtitle")}</Text>

      <FormPanel title={t("products.categoryFirstTitle")}>
        <div className="crm-grid">
          <Text tone="muted">{t("products.categoryFirstHelp")}</Text>
          {error && <Text className="crm-form-error">{error}</Text>}
          <div className="crm-grid crm-grid--form">
            <ReferenceSelect
              id="initialCategoryId"
              label={t("products.category")}
              value={pendingCategoryId}
              options={references.categories}
              placeholder={t("common.selectPlaceholder")}
              onChange={onPendingCategoryChange}
            />
          </div>
          <div className="crm-inline-actions">
            <Button type="button" disabled={!pendingCategoryId} onClick={onContinue}>
              {t("products.categoryFirstSubmit")}
            </Button>
          </div>
        </div>
      </FormPanel>
    </section>
  );
}

function TextField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength?: number; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <input id={id} className="crm-input" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function TextAreaField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength?: number; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <textarea id={id} className="crm-textarea" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function NumberField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <input id={id} className="crm-input" type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Field htmlFor={id} label={label}>
      <select id={id} className="crm-select" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </Field>
  );
}

function ReferenceSelect({
  id,
  label,
  value,
  options,
  placeholder,
  optional = false,
  displayLabels,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Feature[];
  placeholder: string;
  optional?: boolean;
  displayLabels?: Record<string, string>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <SelectField id={id} label={label} value={value} disabled={disabled} onChange={onChange}>
      <option value="">{optional ? placeholder : placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.code && displayLabels?.[option.code] ? displayLabels[option.code] : option.name}
        </option>
      ))}
    </SelectField>
  );
}

function validateForm(form: ProductFormState, t: (key: string) => string) {
  const required = [
    form.nameRu,
    form.model,
    form.price,
    form.stockQuantity,
    form.brandId,
    form.categoryId,
  ];

  if (required.some((value) => !value.trim())) {
    return t("products.requiredError");
  }

  if (!Number.isInteger(Number(form.price)) || Number(form.price) < 0) {
    return t("products.priceError");
  }

  if (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) {
    return t("products.stockError");
  }

  if (!isValidOptionalUrl(form.kaspiUrl) || !isValidOptionalUrl(form.wildberriesUrl)) {
    return t("products.urlError");
  }

  if ([form.nameRu, form.nameEn, form.nameKz, form.model].some((value) => value.trim().length > 255)) {
    return t("products.shortTextLengthError");
  }

  if ([form.descriptionRu, form.descriptionEn, form.descriptionKz].some((value) => value.length > 10000)) {
    return t("products.descriptionLengthError");
  }

  return null;
}

function validateCollectionForm(form: CollectionFormState, t: (key: string) => string) {
  const required = [
    form.brandId,
    form.nameRu,
    form.nameEn,
    form.nameKz,
    form.descriptionRu,
    form.descriptionEn,
    form.descriptionKz,
  ];

  if (required.some((value) => !value.trim())) {
    return t("products.collectionRequiredError");
  }

  return null;
}

function validateSelectedImages(files: File[], t: (key: string) => string) {
  if (files.length === 0) {
    return t("products.photosEmptyError");
  }

  if (files.length > maxImageCount) {
    return t("products.photosTooManyError");
  }

  if (files.some((file) => !isSupportedImageFile(file))) {
    return t("products.photosUnsupportedError");
  }

  if (files.some((file) => file.size > maxImageSizeBytes)) {
    return t("products.photosTooLargeError");
  }

  return null;
}

function isSupportedImageFile(file: File) {
  const extensions = supportedImageExtensionsByType.get(file.type);
  return Boolean(extensions?.has(fileExtension(file.name)));
}

function fileExtension(name: string) {
  const normalizedName = name.trim().toLowerCase();
  const lastDot = normalizedName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === normalizedName.length - 1) {
    return "";
  }

  return normalizedName.slice(lastDot + 1);
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toPayload(form: ProductFormState, categories: References["categories"]): ProductPayload {
  const categoryProfile = getCategoryProfile(categories, form.categoryId);
  const payload: ProductPayload = {
    productName: {
      name_ru: form.nameRu.trim(),
      name_en: form.nameEn.trim(),
      name_kz: form.nameKz.trim(),
    },
    model: form.model.trim(),
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
    status: form.status,
    productType: form.productType,
    brandId: Number(form.brandId),
    collectionId: form.collectionId ? Number(form.collectionId) : null,
    categoryId: Number(form.categoryId),
    description: {
      desc: form.descriptionRu.trim(),
      desc_ru: form.descriptionRu.trim(),
      desc_en: form.descriptionEn.trim(),
      desc_kz: form.descriptionKz.trim(),
    },
    kaspiUrl: form.kaspiUrl.trim() || null,
    wildberriesUrl: form.wildberriesUrl.trim() || null,
  };

  if (categoryProfile === "wristwatch") {
    const hasWatchDetails = [
      form.mechanismId,
      form.genderId,
      form.caseMaterialId,
      form.strapMaterialId,
      form.glassTypeId,
      form.caseSizeMm,
      form.waterResistance,
      form.stoneInlayId,
    ].some((value) => value.trim());
    if (hasWatchDetails) {
      payload.watchDetails = {
        mechanismId: optionalNumber(form.mechanismId),
        genderId: optionalNumber(form.genderId),
        caseMaterialId: optionalNumber(form.caseMaterialId),
        strapMaterialId: optionalNumber(form.strapMaterialId),
        glassTypeId: optionalNumber(form.glassTypeId),
        caseSizeMm: optionalNumber(form.caseSizeMm),
        waterResistance: form.waterResistance.trim() || null,
        stoneInlayId: optionalNumber(form.stoneInlayId),
      };
    }
  }

  if (categoryProfile === "interior") {
    const hasInteriorDetails = [
      form.productionCountryId,
      form.interiorCaseMaterialId,
      form.interiorColorId,
      form.interiorStyleId,
      form.interiorMechanismTypeId,
      form.powerTypeId,
      form.dimensions,
      form.weightGrams,
      form.warrantyMonths,
    ].some((value) => value.trim());
    if (hasInteriorDetails) {
      payload.interiorClockDetails = {
        productionCountryId: optionalNumber(form.productionCountryId),
        caseMaterialId: optionalNumber(form.interiorCaseMaterialId),
        colorId: optionalNumber(form.interiorColorId),
        styleId: optionalNumber(form.interiorStyleId),
        mechanismTypeId: optionalNumber(form.interiorMechanismTypeId),
        powerTypeId: optionalNumber(form.powerTypeId),
        dimensions: form.dimensions.trim() || null,
        weightGrams: optionalNumber(form.weightGrams),
        warrantyMonths: optionalNumber(form.warrantyMonths),
      };
    }
  }

  return payload;
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

function toCollectionPayload(form: CollectionFormState): CollectionPayload {
  return {
    brandId: Number(form.brandId),
    translations: {
      ru: {
        name: form.nameRu.trim(),
        description: form.descriptionRu.trim(),
      },
      en: {
        name: form.nameEn.trim(),
        description: form.descriptionEn.trim(),
      },
      kz: {
        name: form.nameKz.trim(),
        description: form.descriptionKz.trim(),
      },
    },
  };
}

function collectionToOption(collection: CrmCollection): Feature {
  return {
    id: collection.id,
    name: collection.name,
    code: collection.code,
    brandId: collection.brandId,
  };
}

function mergeCollectionOption(collections: Feature[], option: Feature) {
  const withoutDuplicate = collections.filter((collection) => collection.id !== option.id);

  return [...withoutDuplicate, option].sort((left, right) => left.name.localeCompare(right.name));
}

function withSelectedCategory(
  form: ProductFormState,
  categories: References["categories"],
  categoryId: string
): ProductFormState {
  return clearCategoryDetailFields({
    ...form,
    categoryId,
    productType: productTypeForCategory(categories, categoryId),
  });
}

function clearCategoryDetailFields(form: ProductFormState): ProductFormState {
  form.mechanismId = "";
  form.genderId = "";
  form.caseMaterialId = "";
  form.strapMaterialId = "";
  form.glassTypeId = "";
  form.caseSizeMm = "";
  form.waterResistance = "";
  form.stoneInlayId = "";
  form.productionCountryId = "";
  form.interiorCaseMaterialId = "";
  form.interiorColorId = "";
  form.interiorStyleId = "";
  form.interiorMechanismTypeId = "";
  form.powerTypeId = "";
  form.dimensions = "";
  form.weightGrams = "";
  form.warrantyMonths = "";

  return form;
}

function productToForm(product: Product): ProductFormState {
  return {
    ...emptyForm,
    nameRu: product.productName?.name_ru ?? product.name ?? "",
    nameEn: product.productName?.name_en ?? product.name ?? "",
    nameKz: product.productName?.name_kz ?? product.name ?? "",
    model: product.model ?? "",
    price: product.price === null || product.price === undefined ? "" : String(product.price),
    stockQuantity: product.stockQuantity === null || product.stockQuantity === undefined ? "" : String(product.stockQuantity),
    status: product.status,
    productType: product.productType,
    brandId: product.brand?.id ? String(product.brand.id) : "",
    collectionId: product.collection?.id ? String(product.collection.id) : "",
    categoryId: product.category?.id ? String(product.category.id) : "",
    descriptionRu: product.descriptionTranslations?.desc_ru ?? product.description?.content ?? "",
    descriptionEn: product.descriptionTranslations?.desc_en ?? product.description?.content ?? "",
    descriptionKz: product.descriptionTranslations?.desc_kz ?? product.description?.content ?? "",
    mechanismId: product.watchDetails?.mechanism?.id ? String(product.watchDetails.mechanism.id) : "",
    genderId: product.watchDetails?.gender?.id ? String(product.watchDetails.gender.id) : "",
    caseMaterialId: product.watchDetails?.caseMaterial?.id ? String(product.watchDetails.caseMaterial.id) : "",
    strapMaterialId: product.watchDetails?.strapMaterial?.id ? String(product.watchDetails.strapMaterial.id) : "",
    glassTypeId: product.watchDetails?.glassType?.id ? String(product.watchDetails.glassType.id) : "",
    caseSizeMm: product.watchDetails?.caseSizeMm ? String(product.watchDetails.caseSizeMm) : "",
    waterResistance: product.watchDetails?.waterResistance ?? "",
    stoneInlayId: product.watchDetails?.stoneInlay?.id ? String(product.watchDetails.stoneInlay.id) : "",
    productionCountryId: product.interiorClockDetails?.productionCountry?.id ? String(product.interiorClockDetails.productionCountry.id) : "",
    interiorCaseMaterialId: product.interiorClockDetails?.caseMaterial?.id ? String(product.interiorClockDetails.caseMaterial.id) : "",
    interiorColorId: product.interiorClockDetails?.color?.id ? String(product.interiorClockDetails.color.id) : "",
    interiorStyleId: product.interiorClockDetails?.style?.id ? String(product.interiorClockDetails.style.id) : "",
    interiorMechanismTypeId: product.interiorClockDetails?.mechanismType?.id ? String(product.interiorClockDetails.mechanismType.id) : "",
    powerTypeId: product.interiorClockDetails?.powerType?.id ? String(product.interiorClockDetails.powerType.id) : "",
    dimensions: product.interiorClockDetails?.dimensions ?? "",
    weightGrams: product.interiorClockDetails?.weightGrams ? String(product.interiorClockDetails.weightGrams) : "",
    warrantyMonths: product.interiorClockDetails?.warrantyMonths ? String(product.interiorClockDetails.warrantyMonths) : "",
    kaspiUrl: product.kaspiUrl ?? "",
    wildberriesUrl: product.wildberriesUrl ?? "",
  };
}
