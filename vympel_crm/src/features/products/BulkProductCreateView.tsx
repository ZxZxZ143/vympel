"use client";

import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import {
  Feature,
  ProductBulkCreatePayload,
  ProductBulkCreateResult,
  ProductStatus,
  ProductType,
  References,
} from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { messages as localizedMessages } from "@/shared/i18n/messages";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { getCategoryProfile, productTypeForCategory } from "@/features/products/productCategoryProfile";

const statuses: ProductStatus[] = ["DRAFT", "ARCHIVED"];
const productTypes: ProductType[] = ["WATCH", "APPLE_CASE", "ACCESSORY", "WALL_CLOCK", "FLOOR_CLOCK"];
const russianCharacteristicLabels: Record<string, string> = localizedMessages.ru.products.characteristicLabels;

type CommonFormState = {
  brandId: string;
  collectionId: string;
  status: ProductStatus;
  productType: ProductType;
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

type BulkRowState = {
  key: string;
  nameRu: string;
  nameEn: string;
  nameKz: string;
  model: string;
  price: string;
  stockQuantity: string;
  brandId: string;
  collectionId: string;
  status: ProductStatus | "";
  productType: ProductType | "";
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

type BulkProductFormValues = {
  common: CommonFormState;
  rows: BulkRowState[];
};

const emptyCommon: CommonFormState = {
  brandId: "",
  collectionId: "",
  status: "DRAFT",
  productType: "WATCH",
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

function createEmptyRow(): BulkRowState {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nameRu: "",
    nameEn: "",
    nameKz: "",
    model: "",
    price: "",
    stockQuantity: "",
    brandId: "",
    collectionId: "",
    status: "",
    productType: "",
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
}

export function BulkProductCreateView() {
  const notifications = useNotifications();
  const { locale, t, messages } = useI18n();
  const [references, setReferences] = useState<References | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { control, getValues, handleSubmit, setValue } = useForm<BulkProductFormValues>({
    defaultValues: {
      common: emptyCommon,
      rows: [createEmptyRow()],
    },
  });
  const common = useWatch({ control, name: "common" }) ?? emptyCommon;
  const rows = useWatch({ control, name: "rows" }) ?? [];
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<ProductBulkCreateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    crmApi
      .references(locale)
      .then((nextReferences) => {
        if (!alive) return;
        setReferences(nextReferences);
        setError(null);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [locale, t]);

  const categoryProfile = references ? getCategoryProfile(references.categories, categoryId) : "generic";
  const isWristwatchCategory = categoryProfile === "wristwatch";
  const isInteriorClockCategory = categoryProfile === "interior";
  const showNoCategorySpecsHint = categoryProfile === "accessory" || categoryProfile === "generic";

  const visibleCollections = useMemo(() => {
    if (!references) {
      return [];
    }

    return references.collections.filter((collection) => {
      if (!common.brandId || collection.brandId === undefined || collection.brandId === null) {
        return true;
      }

      return String(collection.brandId) === common.brandId;
    });
  }, [common.brandId, references]);

  const selectCategory = () => {
    if (!references || !pendingCategoryId) {
      setError(t("products.categoryFirstError"));
      return;
    }

    setCategoryId(pendingCategoryId);
    setValue("common", { ...emptyCommon, productType: productTypeForCategory(references.categories, pendingCategoryId) }, { shouldDirty: true });
    setError(null);
    setResult(null);
    setRowErrors({});
  };

  const resetCategory = () => {
    setPendingCategoryId(categoryId);
    setCategoryId("");
    setValue("common", emptyCommon, { shouldDirty: true });
    setResult(null);
    setRowErrors({});
    setError(null);
  };

  const updateCommon = <Field extends keyof CommonFormState>(field: Field, value: CommonFormState[Field]) => {
    setValue("common", {
      ...getValues("common"),
      [field]: value,
      ...(field === "brandId" ? { collectionId: "" } : {}),
    } as CommonFormState, { shouldDirty: true });
  };

  const updateRow = <Field extends keyof BulkRowState>(index: number, field: Field, value: BulkRowState[Field]) => {
    setValue("rows", getValues("rows").map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      return {
        ...row,
        [field]: value,
        ...(field === "brandId" ? { collectionId: "" } : {}),
      };
    }), { shouldDirty: true });
    setRowErrors((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  };

  const addRow = () => {
    setValue("rows", [...getValues("rows"), createEmptyRow()], { shouldDirty: true });
  };

  const duplicateRow = (index: number) => {
    const currentRows = getValues("rows");
    const source = currentRows[index];
    if (!source) {
      return;
    }

    const duplicate = { ...source, key: `${Date.now()}-${Math.random().toString(16).slice(2)}` };
    setValue("rows", [...currentRows.slice(0, index + 1), duplicate, ...currentRows.slice(index + 1)], { shouldDirty: true });
  };

  const removeRow = (index: number) => {
    const currentRows = getValues("rows");
    setValue("rows", currentRows.length === 1 ? currentRows : currentRows.filter((_, rowIndex) => rowIndex !== index), { shouldDirty: true });
  };

  const submit = async (values: BulkProductFormValues) => {
    if (!references || saving) {
      return;
    }

    const validation = validateBulkForm(categoryId, values.common, values.rows, t);
    if (validation.error || Object.keys(validation.rowErrors).length > 0) {
      setError(validation.error);
      setRowErrors(validation.rowErrors);
      return;
    }

    setSaving(true);
    setError(null);
    setRowErrors({});
    setResult(null);

    try {
      const nextResult = await crmApi.createProductsBulk(toBulkPayload(categoryId, values.common, values.rows, categoryProfile), locale);
      setResult(nextResult);
      setRowErrors(groupRowErrors(nextResult));

      if (nextResult.createdCount > 0) {
        notifications.success(t("products.bulkCreated"));
      }

      if (nextResult.failedCount > 0) {
        notifications.error(t("products.bulkPartialError"));
      }
    } catch (error) {
      const message = getCrmErrorMessage(error, t("products.bulkCreateError"));
      setError(message);
      notifications.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !references) {
    return <Text tone="muted">{t("common.loading")}</Text>;
  }

  if (!categoryId) {
    return (
      <section className="crm-page">
        <Text tone="muted">{t("products.bulkSubtitle")}</Text>
        <FormPanel title={t("products.bulkCategoryTitle")}>
          <div className="crm-grid">
            <Text tone="muted">{t("products.bulkCategoryHelp")}</Text>
            {error && <Text className="crm-form-error">{error}</Text>}
            <div className="crm-grid crm-grid--form">
              <ReferenceSelect id="bulkCategory" label={t("products.category")} value={pendingCategoryId} options={references.categories} placeholder={t("common.selectPlaceholder")} onChange={setPendingCategoryId} />
            </div>
            <div className="crm-inline-actions">
              <Button type="button" disabled={!pendingCategoryId} onClick={selectCategory}>
                {t("products.categoryFirstSubmit")}
              </Button>
              <Link href="/products">
                <Button type="button" variant="secondary">{t("common.cancel")}</Button>
              </Link>
            </div>
          </div>
        </FormPanel>
      </section>
    );
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("products.bulkSubtitle")}</Text>
      {error && <Text className="crm-form-error">{error}</Text>}

      <form className="crm-page" onSubmit={handleSubmit(submit)}>
        <FormPanel title={t("products.bulkCommonSection")}>
          <div className="crm-grid crm-grid--form">
            <ReferenceSelect id="bulkBrandId" label={t("products.brand")} value={common.brandId} options={references.brands} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("brandId", value)} />
            <ReferenceSelect id="bulkCollectionId" label={t("products.collection")} value={common.collectionId} options={visibleCollections} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("collectionId", value)} optional />
            <SelectField id="bulkStatus" label={t("products.status")} value={common.status} onChange={(value) => updateCommon("status", value as ProductStatus)}>
              {statuses.map((status) => (
                <option key={status} value={status}>{messages.products.statuses[status]}</option>
              ))}
            </SelectField>
            <Text tone="muted" size="small">{t("products.bulkActiveRequiresImage")}</Text>
            <SelectField id="bulkProductType" label={t("products.productType")} value={common.productType} onChange={(value) => updateCommon("productType", value as ProductType)}>
              {productTypes.map((type) => (
                <option key={type} value={type}>{messages.products.types[type]}</option>
              ))}
            </SelectField>
            <ReferenceSelect id="bulkCategorySelected" label={t("products.category")} value={categoryId} options={references.categories} placeholder={t("common.selectPlaceholder")} onChange={() => undefined} disabled />
          </div>

          <div className="crm-form-section">
            <div className="crm-form-section__header">
              <Text as="span" size="small" tone="muted">{t("products.bulkCategoryLockedHint")}</Text>
              <Button type="button" variant="secondary" disabled={saving} onClick={resetCategory}>{t("products.categoryChange")}</Button>
            </div>
          </div>
        </FormPanel>

        <FormPanel title={t("products.descriptionSection")}>
          <div className="crm-grid crm-grid--form">
            <TextAreaField id="bulkDescriptionRu" label={t("products.descriptionRu")} value={common.descriptionRu} onChange={(value) => updateCommon("descriptionRu", value)} />
            <TextAreaField id="bulkDescriptionEn" label={t("products.descriptionEn")} value={common.descriptionEn} onChange={(value) => updateCommon("descriptionEn", value)} />
            <TextAreaField id="bulkDescriptionKz" label={t("products.descriptionKz")} value={common.descriptionKz} onChange={(value) => updateCommon("descriptionKz", value)} />
          </div>
        </FormPanel>

        <FormPanel title={t("products.specsSection")}>
          {isWristwatchCategory && (
            <div className="crm-grid crm-grid--form">
              <ReferenceSelect id="bulkMechanismId" label={t("products.mechanism")} value={common.mechanismId} options={references.mechanisms} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("mechanismId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="bulkGenderId" label={t("products.gender")} value={common.genderId} options={references.genders} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("genderId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="bulkCaseMaterialId" label={t("products.caseMaterial")} value={common.caseMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("caseMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="bulkStrapMaterialId" label={t("products.strapMaterial")} value={common.strapMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("strapMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="bulkGlassTypeId" label={t("products.glassType")} value={common.glassTypeId} options={references.glassTypes} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("glassTypeId", value)} displayLabels={russianCharacteristicLabels} />
              <NumberField id="bulkCaseSizeMm" label={t("products.caseSizeMm")} value={common.caseSizeMm} onChange={(value) => updateCommon("caseSizeMm", value)} />
              <TextField id="bulkWaterResistance" label={t("products.waterResistance")} value={common.waterResistance} onChange={(value) => updateCommon("waterResistance", value)} />
              <ReferenceSelect id="bulkStoneInlayId" label={t("products.stoneInlay")} value={common.stoneInlayId} options={references.stoneInlays} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("stoneInlayId", value)} displayLabels={russianCharacteristicLabels} optional />
            </div>
          )}

          {isInteriorClockCategory && (
            <div className="crm-grid crm-grid--form">
              <ReferenceSelect id="bulkProductionCountryId" label={t("products.productionCountry")} value={common.productionCountryId} options={references.countries} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("productionCountryId", value)} />
              <ReferenceSelect id="bulkInteriorCaseMaterialId" label={t("products.interiorCaseMaterial")} value={common.interiorCaseMaterialId} options={references.materials} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("interiorCaseMaterialId", value)} displayLabels={russianCharacteristicLabels} />
              <ReferenceSelect id="bulkInteriorColorId" label={t("products.interiorColor")} value={common.interiorColorId} options={references.interiorColors} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("interiorColorId", value)} />
              <ReferenceSelect id="bulkInteriorStyleId" label={t("products.interiorStyle")} value={common.interiorStyleId} options={references.interiorStyles} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("interiorStyleId", value)} optional />
              <ReferenceSelect id="bulkInteriorMechanismTypeId" label={t("products.interiorMechanismType")} value={common.interiorMechanismTypeId} options={references.interiorMechanisms} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("interiorMechanismTypeId", value)} />
              <ReferenceSelect id="bulkPowerTypeId" label={t("products.powerType")} value={common.powerTypeId} options={references.interiorPowerTypes} placeholder={t("common.selectPlaceholder")} onChange={(value) => updateCommon("powerTypeId", value)} />
              <TextField id="bulkDimensions" label={t("products.dimensions")} value={common.dimensions} onChange={(value) => updateCommon("dimensions", value)} />
              <NumberField id="bulkWeightGrams" label={t("products.weightGrams")} value={common.weightGrams} onChange={(value) => updateCommon("weightGrams", value)} />
              <NumberField id="bulkWarrantyMonths" label={t("products.warrantyMonths")} value={common.warrantyMonths} onChange={(value) => updateCommon("warrantyMonths", value)} />
            </div>
          )}

          {showNoCategorySpecsHint && <Text tone="muted">{t("products.categorySpecsHint")}</Text>}
        </FormPanel>

        <FormPanel title={t("products.linksSection")}>
          <div className="crm-grid crm-grid--form">
            <TextField id="bulkKaspiUrl" label={t("products.kaspiUrl")} value={common.kaspiUrl} onChange={(value) => updateCommon("kaspiUrl", value)} />
            <TextField id="bulkWildberriesUrl" label={t("products.wildberriesUrl")} value={common.wildberriesUrl} onChange={(value) => updateCommon("wildberriesUrl", value)} />
          </div>
        </FormPanel>

        <FormPanel title={t("products.bulkRowsSection")}>
          <div className="crm-grid">
            <Text tone="muted">{t("products.bulkRowsHelp")}</Text>
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>{t("products.nameRu")}</th>
                    <th>{t("products.nameEn")}</th>
                    <th>{t("products.nameKz")}</th>
                    <th>{t("products.model")}</th>
                    <th>{t("products.price")}</th>
                    <th>{t("products.stockQuantity")}</th>
                    <th>{t("products.kaspi")}</th>
                    <th>{t("products.wildberries")}</th>
                    <th>{t("common.edit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const rowBrandId = row.brandId || common.brandId;
                    const rowCollections = references.collections.filter((collection) => {
                      if (!rowBrandId || collection.brandId === undefined || collection.brandId === null) {
                        return true;
                      }

                      return String(collection.brandId) === rowBrandId;
                    });

                    return (
                      <Fragment key={row.key}>
                        <tr>
                          <td><input className="crm-input" value={row.nameRu} onChange={(event) => updateRow(index, "nameRu", event.target.value)} /></td>
                          <td><input className="crm-input" value={row.nameEn} onChange={(event) => updateRow(index, "nameEn", event.target.value)} /></td>
                          <td><input className="crm-input" value={row.nameKz} onChange={(event) => updateRow(index, "nameKz", event.target.value)} /></td>
                          <td><input className="crm-input" value={row.model} onChange={(event) => updateRow(index, "model", event.target.value)} /></td>
                          <td><input className="crm-input" type="number" min="0" value={row.price} onChange={(event) => updateRow(index, "price", event.target.value)} /></td>
                          <td><input className="crm-input" type="number" min="0" value={row.stockQuantity} onChange={(event) => updateRow(index, "stockQuantity", event.target.value)} /></td>
                          <td><input className="crm-input" value={row.kaspiUrl} onChange={(event) => updateRow(index, "kaspiUrl", event.target.value)} /></td>
                          <td><input className="crm-input" value={row.wildberriesUrl} onChange={(event) => updateRow(index, "wildberriesUrl", event.target.value)} /></td>
                          <td>
                            <div className="crm-inline-actions">
                              <Button type="button" variant="secondary" disabled={saving} onClick={() => duplicateRow(index)}>{t("products.bulkDuplicateRow")}</Button>
                              <Button type="button" variant="danger" disabled={saving || rows.length === 1} onClick={() => removeRow(index)}>{t("products.bulkRemoveRow")}</Button>
                            </div>
                            {rowErrors[index]?.map((message) => (
                              <Text key={message} className="crm-form-error">{message}</Text>
                            ))}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={9}>
                            <div className="crm-grid">
                              <Text tone="muted" size="small">{t("products.bulkRowOverrides")}</Text>
                              <div className="crm-grid crm-grid--form">
                                <ReferenceSelect id={`rowBrandId-${row.key}`} label={t("products.brand")} value={row.brandId} options={references.brands} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "brandId", value)} optional />
                                <ReferenceSelect id={`rowCollectionId-${row.key}`} label={t("products.collection")} value={row.collectionId} options={rowCollections} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "collectionId", value)} optional />
                                <SelectField id={`rowStatus-${row.key}`} label={t("products.status")} value={row.status} onChange={(value) => updateRow(index, "status", value as BulkRowState["status"])}>
                                  <option value="">{t("products.bulkUseCommonDefault")}</option>
                                  {statuses.map((status) => (
                                    <option key={status} value={status}>{messages.products.statuses[status]}</option>
                                  ))}
                                </SelectField>
                                <SelectField id={`rowProductType-${row.key}`} label={t("products.productType")} value={row.productType} onChange={(value) => updateRow(index, "productType", value as BulkRowState["productType"])}>
                                  <option value="">{t("products.bulkUseCommonDefault")}</option>
                                  {productTypes.map((type) => (
                                    <option key={type} value={type}>{messages.products.types[type]}</option>
                                  ))}
                                </SelectField>
                                <TextAreaField id={`rowDescriptionRu-${row.key}`} label={t("products.descriptionRu")} value={row.descriptionRu} onChange={(value) => updateRow(index, "descriptionRu", value)} />
                                <TextAreaField id={`rowDescriptionEn-${row.key}`} label={t("products.descriptionEn")} value={row.descriptionEn} onChange={(value) => updateRow(index, "descriptionEn", value)} />
                                <TextAreaField id={`rowDescriptionKz-${row.key}`} label={t("products.descriptionKz")} value={row.descriptionKz} onChange={(value) => updateRow(index, "descriptionKz", value)} />
                              </div>

                              {isWristwatchCategory && (
                                <div className="crm-grid crm-grid--form">
                                  <ReferenceSelect id={`rowMechanismId-${row.key}`} label={t("products.mechanism")} value={row.mechanismId} options={references.mechanisms} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "mechanismId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <ReferenceSelect id={`rowGenderId-${row.key}`} label={t("products.gender")} value={row.genderId} options={references.genders} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "genderId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <ReferenceSelect id={`rowCaseMaterialId-${row.key}`} label={t("products.caseMaterial")} value={row.caseMaterialId} options={references.materials} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "caseMaterialId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <ReferenceSelect id={`rowStrapMaterialId-${row.key}`} label={t("products.strapMaterial")} value={row.strapMaterialId} options={references.materials} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "strapMaterialId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <ReferenceSelect id={`rowGlassTypeId-${row.key}`} label={t("products.glassType")} value={row.glassTypeId} options={references.glassTypes} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "glassTypeId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <NumberField id={`rowCaseSizeMm-${row.key}`} label={t("products.caseSizeMm")} value={row.caseSizeMm} onChange={(value) => updateRow(index, "caseSizeMm", value)} />
                                  <TextField id={`rowWaterResistance-${row.key}`} label={t("products.waterResistance")} value={row.waterResistance} onChange={(value) => updateRow(index, "waterResistance", value)} />
                                  <ReferenceSelect id={`rowStoneInlayId-${row.key}`} label={t("products.stoneInlay")} value={row.stoneInlayId} options={references.stoneInlays} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "stoneInlayId", value)} displayLabels={russianCharacteristicLabels} optional />
                                </div>
                              )}

                              {isInteriorClockCategory && (
                                <div className="crm-grid crm-grid--form">
                                  <ReferenceSelect id={`rowProductionCountryId-${row.key}`} label={t("products.productionCountry")} value={row.productionCountryId} options={references.countries} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "productionCountryId", value)} optional />
                                  <ReferenceSelect id={`rowInteriorCaseMaterialId-${row.key}`} label={t("products.interiorCaseMaterial")} value={row.interiorCaseMaterialId} options={references.materials} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "interiorCaseMaterialId", value)} displayLabels={russianCharacteristicLabels} optional />
                                  <ReferenceSelect id={`rowInteriorColorId-${row.key}`} label={t("products.interiorColor")} value={row.interiorColorId} options={references.interiorColors} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "interiorColorId", value)} optional />
                                  <ReferenceSelect id={`rowInteriorStyleId-${row.key}`} label={t("products.interiorStyle")} value={row.interiorStyleId} options={references.interiorStyles} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "interiorStyleId", value)} optional />
                                  <ReferenceSelect id={`rowInteriorMechanismTypeId-${row.key}`} label={t("products.interiorMechanismType")} value={row.interiorMechanismTypeId} options={references.interiorMechanisms} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "interiorMechanismTypeId", value)} optional />
                                  <ReferenceSelect id={`rowPowerTypeId-${row.key}`} label={t("products.powerType")} value={row.powerTypeId} options={references.interiorPowerTypes} placeholder={t("products.bulkUseCommonDefault")} onChange={(value) => updateRow(index, "powerTypeId", value)} optional />
                                  <TextField id={`rowDimensions-${row.key}`} label={t("products.dimensions")} value={row.dimensions} onChange={(value) => updateRow(index, "dimensions", value)} />
                                  <NumberField id={`rowWeightGrams-${row.key}`} label={t("products.weightGrams")} value={row.weightGrams} onChange={(value) => updateRow(index, "weightGrams", value)} />
                                  <NumberField id={`rowWarrantyMonths-${row.key}`} label={t("products.warrantyMonths")} value={row.warrantyMonths} onChange={(value) => updateRow(index, "warrantyMonths", value)} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="crm-inline-actions">
              <Button type="button" variant="secondary" disabled={saving} onClick={addRow}>{t("products.bulkAddRow")}</Button>
              <Button type="submit" isLoading={saving}>{saving ? t("common.loading") : t("products.bulkSubmit")}</Button>
              <Link href="/products"><Button type="button" variant="secondary" disabled={saving}>{t("common.cancel")}</Button></Link>
            </div>
          </div>
        </FormPanel>

        {result && (
          <FormPanel title={t("products.bulkResultSection")}>
            <div className="crm-grid">
              <Text>{t("products.bulkCreatedCount")}: {result.createdCount}</Text>
              <Text>{t("products.bulkFailedCount")}: {result.failedCount}</Text>
              {result.createdProducts.length > 0 && (
                <div className="crm-table-wrap">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>{t("products.bulkRow")}</th>
                        <th>{t("products.sku")}</th>
                        <th>{t("common.edit")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.createdProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.rowIndex + 1}</td>
                          <td>{product.sku}</td>
                          <td><Link href={`/products/${product.id}`}>{t("common.edit")}</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FormPanel>
        )}
      </form>
    </section>
  );
}

function FormPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="crm-panel">
      <div className="crm-panel__header">
        <Heading as="h2" size="title">{title}</Heading>
      </div>
      <div className="crm-panel__body">{children}</div>
    </section>
  );
}

function TextField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <input id={id} className="crm-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function TextAreaField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <textarea id={id} className="crm-textarea" value={value} onChange={(event) => onChange(event.target.value)} />
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

function SelectField({ id, label, value, onChange, disabled = false, children }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; children: ReactNode }) {
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

function validateBulkForm(
  categoryId: string,
  common: CommonFormState,
  rows: BulkRowState[],
  t: (key: string) => string
) {
  let error: string | null = null;
  const rowErrors: Record<number, string[]> = {};
  const commonRequired = [categoryId, common.brandId, common.status, common.productType];

  if (commonRequired.some((value) => !value.trim())) {
    error = t("products.requiredError");
  }

  if (!isValidOptionalUrl(common.kaspiUrl) || !isValidOptionalUrl(common.wildberriesUrl)) {
    error = t("products.urlError");
  }

  rows.forEach((row, index) => {
    const errors: string[] = [];
    if (![row.nameRu, row.model, row.price, row.stockQuantity].every((value) => value.trim())) {
      errors.push(t("products.bulkRowRequiredError"));
    }

    if (toNonNegativeInteger(row.price) === null) {
      errors.push(t("products.priceError"));
    }

    if (toNonNegativeInteger(row.stockQuantity) === null) {
      errors.push(t("products.stockError"));
    }

    if (!isValidOptionalUrl(row.kaspiUrl) || !isValidOptionalUrl(row.wildberriesUrl)) {
      errors.push(t("products.urlError"));
    }

    if (errors.length > 0) {
      rowErrors[index] = errors;
    }
  });

  return { error, rowErrors };
}

function toBulkPayload(
  categoryId: string,
  common: CommonFormState,
  rows: BulkRowState[],
  categoryProfile: ReturnType<typeof getCategoryProfile>
): ProductBulkCreatePayload {
  const payload: ProductBulkCreatePayload = {
    categoryId: Number(categoryId),
    common: {
      brandId: Number(common.brandId),
      collectionId: common.collectionId ? Number(common.collectionId) : null,
      status: common.status,
      productType: common.productType,
      kaspiUrl: common.kaspiUrl.trim() || null,
      wildberriesUrl: common.wildberriesUrl.trim() || null,
    },
    rows: rows.map((row) => rowToPayload(row, common, categoryProfile)),
  };

  if ([common.descriptionRu, common.descriptionEn, common.descriptionKz].some((value) => value.trim())) {
    payload.common.description = toDescriptionPayload(common.descriptionRu, common.descriptionEn, common.descriptionKz);
  }

  if (categoryProfile === "wristwatch" && hasWatchDetails(common)) {
    payload.common.watchDetails = {
      mechanismId: optionalNumber(common.mechanismId),
      genderId: optionalNumber(common.genderId),
      caseMaterialId: optionalNumber(common.caseMaterialId),
      strapMaterialId: optionalNumber(common.strapMaterialId),
      glassTypeId: optionalNumber(common.glassTypeId),
      caseSizeMm: optionalNumber(common.caseSizeMm),
      waterResistance: common.waterResistance.trim() || null,
      stoneInlayId: optionalNumber(common.stoneInlayId),
    };
  }

  if (categoryProfile === "interior" && hasInteriorDetails(common)) {
    payload.common.interiorClockDetails = {
      productionCountryId: optionalNumber(common.productionCountryId),
      caseMaterialId: optionalNumber(common.interiorCaseMaterialId),
      colorId: optionalNumber(common.interiorColorId),
      styleId: optionalNumber(common.interiorStyleId),
      mechanismTypeId: optionalNumber(common.interiorMechanismTypeId),
      powerTypeId: optionalNumber(common.powerTypeId),
      dimensions: common.dimensions.trim() || null,
      weightGrams: optionalNumber(common.weightGrams),
      warrantyMonths: optionalNumber(common.warrantyMonths),
    };
  }

  return payload;
}

function rowToPayload(
  row: BulkRowState,
  common: CommonFormState,
  categoryProfile: ReturnType<typeof getCategoryProfile>
): ProductBulkCreatePayload["rows"][number] {
  const payload: ProductBulkCreatePayload["rows"][number] = {
    productName: {
      name_ru: row.nameRu.trim(),
      name_en: row.nameEn.trim(),
      name_kz: row.nameKz.trim(),
    },
    model: row.model.trim(),
    price: Number(row.price),
    stockQuantity: Number(row.stockQuantity),
    brandId: row.brandId ? Number(row.brandId) : null,
    collectionId: row.collectionId ? Number(row.collectionId) : null,
    status: row.status || null,
    productType: row.productType || null,
    kaspiUrl: row.kaspiUrl.trim() || null,
    wildberriesUrl: row.wildberriesUrl.trim() || null,
  };

  const descriptions = [
    firstNonBlank(row.descriptionRu, common.descriptionRu),
    firstNonBlank(row.descriptionEn, common.descriptionEn),
    firstNonBlank(row.descriptionKz, common.descriptionKz),
  ];
  if (descriptions.some((value) => value.trim())) {
    payload.description = toDescriptionPayload(descriptions[0], descriptions[1], descriptions[2]);
  }

  if (categoryProfile === "wristwatch" && hasResolvedWatchDetails(row, common)) {
    payload.watchDetails = {
      mechanismId: optionalNumber(firstNonBlank(row.mechanismId, common.mechanismId)),
      genderId: optionalNumber(firstNonBlank(row.genderId, common.genderId)),
      caseMaterialId: optionalNumber(firstNonBlank(row.caseMaterialId, common.caseMaterialId)),
      strapMaterialId: optionalNumber(firstNonBlank(row.strapMaterialId, common.strapMaterialId)),
      glassTypeId: optionalNumber(firstNonBlank(row.glassTypeId, common.glassTypeId)),
      caseSizeMm: optionalNumber(firstNonBlank(row.caseSizeMm, common.caseSizeMm)),
      waterResistance: firstNonBlank(row.waterResistance, common.waterResistance).trim() || null,
      stoneInlayId: optionalNumber(firstNonBlank(row.stoneInlayId, common.stoneInlayId)),
    };
  }

  if (categoryProfile === "interior" && hasResolvedInteriorDetails(row, common)) {
    payload.interiorClockDetails = {
      productionCountryId: optionalNumber(firstNonBlank(row.productionCountryId, common.productionCountryId)),
      caseMaterialId: optionalNumber(firstNonBlank(row.interiorCaseMaterialId, common.interiorCaseMaterialId)),
      colorId: optionalNumber(firstNonBlank(row.interiorColorId, common.interiorColorId)),
      styleId: optionalNumber(firstNonBlank(row.interiorStyleId, common.interiorStyleId)),
      mechanismTypeId: optionalNumber(firstNonBlank(row.interiorMechanismTypeId, common.interiorMechanismTypeId)),
      powerTypeId: optionalNumber(firstNonBlank(row.powerTypeId, common.powerTypeId)),
      dimensions: firstNonBlank(row.dimensions, common.dimensions).trim() || null,
      weightGrams: optionalNumber(firstNonBlank(row.weightGrams, common.weightGrams)),
      warrantyMonths: optionalNumber(firstNonBlank(row.warrantyMonths, common.warrantyMonths)),
    };
  }

  return payload;
}

function toDescriptionPayload(descriptionRu: string, descriptionEn: string, descriptionKz: string) {
  const descRu = descriptionRu.trim();

  return {
    desc: descRu,
    desc_ru: descRu,
    desc_en: descriptionEn.trim(),
    desc_kz: descriptionKz.trim(),
  };
}

function firstNonBlank(primary: string, fallback: string) {
  return primary.trim() ? primary : fallback;
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function hasWatchDetails(common: CommonFormState) {
  return [
    common.mechanismId,
    common.genderId,
    common.caseMaterialId,
    common.strapMaterialId,
    common.glassTypeId,
    common.caseSizeMm,
    common.waterResistance,
    common.stoneInlayId,
  ].some((value) => value.trim());
}

function hasInteriorDetails(common: CommonFormState) {
  return [
    common.productionCountryId,
    common.interiorCaseMaterialId,
    common.interiorColorId,
    common.interiorMechanismTypeId,
    common.powerTypeId,
    common.interiorStyleId,
    common.dimensions,
    common.weightGrams,
    common.warrantyMonths,
  ].some((value) => value.trim());
}

function hasResolvedWatchDetails(row: BulkRowState, common: CommonFormState) {
  return [
    firstNonBlank(row.mechanismId, common.mechanismId),
    firstNonBlank(row.genderId, common.genderId),
    firstNonBlank(row.caseMaterialId, common.caseMaterialId),
    firstNonBlank(row.strapMaterialId, common.strapMaterialId),
    firstNonBlank(row.glassTypeId, common.glassTypeId),
    firstNonBlank(row.caseSizeMm, common.caseSizeMm),
    firstNonBlank(row.waterResistance, common.waterResistance),
    firstNonBlank(row.stoneInlayId, common.stoneInlayId),
  ].some((value) => value.trim());
}

function hasResolvedInteriorDetails(row: BulkRowState, common: CommonFormState) {
  return [
    firstNonBlank(row.productionCountryId, common.productionCountryId),
    firstNonBlank(row.interiorCaseMaterialId, common.interiorCaseMaterialId),
    firstNonBlank(row.interiorColorId, common.interiorColorId),
    firstNonBlank(row.interiorStyleId, common.interiorStyleId),
    firstNonBlank(row.interiorMechanismTypeId, common.interiorMechanismTypeId),
    firstNonBlank(row.powerTypeId, common.powerTypeId),
    firstNonBlank(row.dimensions, common.dimensions),
    firstNonBlank(row.weightGrams, common.weightGrams),
    firstNonBlank(row.warrantyMonths, common.warrantyMonths),
  ].some((value) => value.trim());
}

function groupRowErrors(result: ProductBulkCreateResult) {
  return result.errors.reduce<Record<number, string[]>>((acc, item) => {
    acc[item.rowIndex] = [...(acc[item.rowIndex] ?? []), item.message];
    return acc;
  }, {});
}

function toNonNegativeInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
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
