"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { Page, ProductListItem, ProductStatus } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ActionIcon } from "@/shared/ui/ActionIcon";
import { ButtonLink } from "@/shared/ui/ButtonLink";
import { Text } from "@/shared/ui/Text";
import { subscribeToProductListChanges } from "@/features/products/productListRefresh";
import { ProductModelVariantStrip } from "@/features/products/ProductModelVariantStrip";

type ProductSearchFormValues = {
  search: string;
};

const PAGE_SIZE = 12;

type ProductQuickEditFormValues = {
  price: string;
  stock: string;
  discount: string;
};

export function ProductListView() {
  const { locale, t, messages } = useI18n();
  const notifications = useNotifications();
  const [page, setPage] = useState<Page<ProductListItem> | null>(null);
  const { handleSubmit, register } = useForm<ProductSearchFormValues>({
    defaultValues: {
      search: "",
    },
  });
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState(false);
  const loadSequenceRef = useRef(0);

  const loadProducts = useCallback(async () => {
    const sequence = ++loadSequenceRef.current;
    try {
      const nextPage = await crmApi.products({
        lang: locale,
        page: pageIndex,
        size: PAGE_SIZE,
        search: submittedSearch,
        status,
      });
      if (sequence === loadSequenceRef.current) {
        setPage(nextPage);
        setError(false);
      }
    } catch {
      if (sequence === loadSequenceRef.current) {
        setError(true);
        notifications.error(t("products.listRefreshError"));
      }
    }
  }, [locale, notifications, pageIndex, status, submittedSearch, t]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadProducts();
    });
    return () => {
      active = false;
      loadSequenceRef.current += 1;
    };
  }, [loadProducts]);

  useEffect(
    () => subscribeToProductListChanges(() => {
      void loadProducts();
    }),
    [loadProducts]
  );

  const submitSearch = (values: ProductSearchFormValues) => {
    setPageIndex(0);
    setSubmittedSearch(values.search.trim());
  };

  const changeStatus = (nextStatus: string) => {
    setPageIndex(0);
    setStatus(nextStatus as ProductStatus | "");
  };

  const replaceProduct = (product: ProductListItem) => {
    setPage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        content: current.content.map((item) => (item.id === product.id ? product : item)),
      };
    });
  };

  if (error) {
    return <Text className="crm-form-error">{t("common.error")}</Text>;
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("products.subtitle")}</Text>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <form className="crm-product-list-controls" onSubmit={handleSubmit(submitSearch)}>
            <div className="crm-inline-actions">
              <input
                {...register("search")}
                className="crm-input"
                aria-label={t("common.search")}
                placeholder={t("products.searchPlaceholder")}
              />
              <select
                className="crm-select"
                aria-label={t("products.status")}
                value={status}
                onChange={(event) => changeStatus(event.target.value)}
              >
                <option value="">{t("products.allStatuses")}</option>
                <option value="ACTIVE">{messages.products.statuses.ACTIVE}</option>
                <option value="DRAFT">{messages.products.statuses.DRAFT}</option>
                <option value="ARCHIVED">{messages.products.statuses.ARCHIVED}</option>
              </select>
              <Button type="submit" variant="secondary">
                {t("common.search")}
              </Button>
            </div>
          </form>
          <div className="crm-inline-actions">
            <ButtonLink href="/products/new">{t("products.addProduct")}</ButtonLink>
            <ButtonLink href="/products/bulk" variant="secondary">{t("products.bulkAddProduct")}</ButtonLink>
          </div>
        </div>

        {!page ? (
          <div className="crm-panel__body">
            <Text tone="muted">{t("common.loading")}</Text>
          </div>
        ) : page.content.length === 0 ? (
          <div className="crm-panel__body crm-empty">
            <Text tone="muted">{t("common.empty")}</Text>
          </div>
        ) : (
          <div className="crm-table-wrap" tabIndex={0}>
            <table className="crm-table crm-products-table">
              <colgroup><col/><col className="crm-products-col--model"/><col className="crm-products-col--price"/><col className="crm-products-col--stock"/><col className="crm-products-col--status"/><col className="crm-products-col--kaspi"/><col className="crm-products-col--wb"/><col className="crm-products-col--actions"/></colgroup>
              <thead>
                <tr>
                  <th>{t("products.name")}</th>
                  <th>{t("products.model")}</th>
                  <th>{t("products.price")}</th>
                  <th>{t("products.stockQuantity")}</th>
                  <th>{t("products.status")}</th>
                  <th>{t("products.kaspi")}</th>
                  <th>{t("products.wildberries")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {page.content.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    locale={locale}
                    statusLabel={messages.products.statuses[product.status] ?? product.status}
                    onProductChange={replaceProduct}
                    onProductsRefresh={loadProducts}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
            <div className="crm-pagination">
              <Text tone="muted" size="caption">
                {t("products.found")}: {page.totalElements}. {t("products.page")} {page.number + 1} {t("products.of")} {Math.max(page.totalPages, 1)}
              </Text>
              <div className="crm-inline-actions">
                <Button
                  variant="secondary"
                  disabled={page.first}
                  onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                >
                  {t("products.previous")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={page.last}
                  onClick={() => setPageIndex((current) => current + 1)}
                >
                  {t("products.next")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

function ProductRow({
  product,
  locale,
  statusLabel,
  onProductChange,
  onProductsRefresh,
  t,
}: {
  product: ProductListItem;
  locale: string;
  statusLabel: string;
  onProductChange: (product: ProductListItem) => void;
  onProductsRefresh: () => Promise<void>;
  t: (key: string) => string;
}) {
  const notifications = useNotifications();
  const { getValues, register, reset, setValue } = useForm<ProductQuickEditFormValues>({
    defaultValues: {
      price: toInputValue(product.price),
      stock: toInputValue(product.stockQuantity),
      discount: toInputValue(product.discountPercent),
    },
  });
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateDiscount = async (clear = false) => {
    if (busy || busyRef.current) return;
    const raw = clear ? "" : getValues("discount").trim();
    const discount = raw === "" ? null : Number(raw);
    if (discount !== null && (!/^\d+$/.test(raw) || !Number.isInteger(discount) || discount < 1 || discount > 99)) {
      notifications.error(t("catalogTools.discountInvalid"));
      return;
    }
    busyRef.current = true;
    setBusy("discount");
    try {
      const updated = await crmApi.updateDiscount(product.id, discount, locale);
      onProductChange(updated);
      await onProductsRefresh();
      notifications.success(t(discount === null ? "catalogTools.discountRemoved" : "catalogTools.discountSaved"));
    } catch {
      notifications.error(t("catalogTools.discountError"));
    } finally { busyRef.current = false; setBusy(null); }
  };

  const deletePermanently = async () => {
    if (busy || busyRef.current) return;
    busyRef.current = true;
    setBusy("delete");
    try {
      await crmApi.deleteArchivedProduct(product.id);
      setDeleteOpen(false);
      notifications.success(t("catalogTools.deleted"));
      await onProductsRefresh();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("catalogTools.deleteError"), undefined, {
        PRODUCT_NOT_ARCHIVED: t("catalogTools.notArchived"), PRODUCT_MEDIA_IN_USE: t("catalogTools.mediaInUse"),
      }));
    } finally { busyRef.current = false; setBusy(null); }
  };

  useEffect(() => {
    reset({
      price: toInputValue(product.price),
      stock: toInputValue(product.stockQuantity),
      discount: toInputValue(product.discountPercent),
    });
  }, [product.id, product.price, product.stockQuantity, product.discountPercent, reset]);

  const updatePrice = async () => {
    if (busy || busyRef.current) {
      return;
    }

    const nextPrice = parseNonNegativeInteger(getValues("price"));
    if (nextPrice === null) {
      notifications.error(t("products.priceError"));
      return;
    }

    busyRef.current = true;
    setBusy("price");
    try {
      const nextProduct = await crmApi.updatePrice(product.id, nextPrice, locale);
      setValue("price", toInputValue(nextProduct.price));
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.priceUpdated"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.priceUpdateError")));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const updateStock = async () => {
    if (busy || busyRef.current) {
      return;
    }

    const nextStock = parseNonNegativeInteger(getValues("stock"));
    if (nextStock === null) {
      notifications.error(t("products.stockError"));
      return;
    }

    busyRef.current = true;
    setBusy("stock");
    try {
      const nextProduct = await crmApi.updateStock(product.id, nextStock, locale);
      setValue("stock", toInputValue(nextProduct.stockQuantity));
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.stockUpdated"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.stockUpdateError")));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const archive = async () => {
    if (busy || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy("archive");
    try {
      const nextProduct = await crmApi.archiveProduct(product.id, locale);
      onProductChange(nextProduct);
      await onProductsRefresh();
      notifications.success(t("products.archived"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("products.archiveError")));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  return (
    <tr>
      <td>
        <Text as="span" size="small" className="crm-product-row__name" title={product.name}>
          {product.name}
        </Text>
        <Text tone="muted" size="caption" className="crm-product-row__sku" title={product.sku}>
          {product.sku}
        </Text>
      </td>
      <td>
        <Text as="span" size="caption" className="crm-product-row__model">{product.model}</Text>
        <ProductModelVariantStrip
          currentProductId={product.id}
          group={product.modelVariantGroup}
          compact
        />
      </td>
      <td>
        <div className="crm-product-row__pricing">
          <div className="crm-quick-control">
            <input {...register("price")} aria-label={t("products.price")} className="crm-input crm-quick-control__price" type="number" min="0" disabled={busy !== null}/>
            <Button variant="secondary" className="crm-icon-button" title={t("products.quickSave")} aria-label={`${t("products.quickSave")}: ${t("products.price")}`} isLoading={busy === "price"} disabled={busy !== null} onClick={updatePrice}><ActionIcon name="save"/></Button>
          </div>
          <div className="crm-quick-control crm-discount-control">
            <input {...register("discount")} aria-label={t("catalogTools.discount")} title={t("catalogTools.discount")} className="crm-input" type="number" min="1" max="99" step="1" placeholder="—" disabled={busy !== null}/>
            <span aria-hidden="true">%</span>
            <Button variant="secondary" className="crm-icon-button" title={t("catalogTools.discountSave")} aria-label={t("catalogTools.discountSave")} isLoading={busy === "discount"} disabled={busy !== null} onClick={() => void updateDiscount()}><ActionIcon name="save"/></Button>
            {product.discountPercent != null ? <Button variant="secondary" className="crm-icon-button" title={t("catalogTools.discountClear")} aria-label={t("catalogTools.discountClear")} disabled={busy !== null} onClick={() => void updateDiscount(true)}><ActionIcon name="clear"/></Button> : null}
          </div>
        </div>
        {product.discountPercent != null ? <Text size="caption" tone="muted" className="crm-product-row__final">{t("catalogTools.finalPrice")}: {product.finalPrice?.toLocaleString(locale === "kz" ? "kk-KZ" : locale)} ₸</Text> : null}
      </td>
      <td>
        <div className="crm-quick-control">
          <input {...register("stock")} aria-label={t("products.stockQuantity")} className="crm-input crm-quick-control__stock" type="number" min="0" disabled={busy !== null}/>
          <Button variant="secondary" className="crm-icon-button" title={t("products.quickSave")} aria-label={`${t("products.quickSave")}: ${t("products.stockQuantity")}`} isLoading={busy === "stock"} disabled={busy !== null} onClick={updateStock}><ActionIcon name="save"/></Button>
        </div>
      </td>
      <td>
        <span className="crm-chip">{statusLabel}</span>
      </td>
      <td>
        <span className={product.kaspiUrl ? "crm-chip crm-chip--success" : "crm-chip crm-chip--danger"}>
          {product.kaspiUrl ? t("products.linkReady") : t("products.linkMissing")}
        </span>
      </td>
      <td>
        <span className={product.wildberriesUrl ? "crm-chip crm-chip--success" : "crm-chip crm-chip--danger"}>
          {product.wildberriesUrl ? t("products.linkReady") : t("products.linkMissing")}
        </span>
      </td>
      <td>
        <div className="crm-product-row__actions">
          <ButtonLink href={`/products/${product.id}`} variant="secondary" className="crm-icon-button" title={t("common.edit")} aria-label={t("common.edit")}><ActionIcon name="edit"/></ButtonLink>
          {product.status === "ARCHIVED" ? (
            <Button variant="danger" className="crm-icon-button" title={t("catalogTools.delete")} aria-label={t("catalogTools.delete")} disabled={busy !== null} onClick={() => setDeleteOpen(true)}><ActionIcon name="trash"/></Button>
          ) : (
            <Button variant="danger" className="crm-icon-button" title={t("common.delete")} aria-label={t("common.delete")} isLoading={busy === "archive"} disabled={busy !== null && busy !== "archive"} onClick={archive}><ActionIcon name="archive"/></Button>
          )}
          <ConfirmDialog open={deleteOpen} title={t("catalogTools.deleteTitle")} description={t("catalogTools.deleteWarning")}
            confirmLabel={t("catalogTools.delete")} cancelLabel={t("common.cancel")} isLoading={busy === "delete"}
            onConfirm={deletePermanently} onOpenChange={(open) => { if (!busy) setDeleteOpen(open); }}/>

        </div>
      </td>
    </tr>
  );
}

function toInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNonNegativeInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}
