/* eslint-disable @next/next/no-img-element -- CMS previews render dynamic MinIO, public, and blob URLs. */
"use client";

import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import {
  CmsBlock,
  CmsBlockPayload,
  CmsBlockStatus,
  CmsBlockType,
  CmsLinkOpenBehavior,
  CmsLinkType,
  CmsPage,
  CmsPageSummary,
  CmsTranslationPayload,
} from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { CrmLocale } from "@/shared/i18n/messages";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field } from "@/shared/ui/Field";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";
import { cx } from "@/shared/utils/cx";
import { CmsBlockSchema, cmsBlockSchemas } from "@/features/cms/cmsBlockSchemas";
import { cmsRefreshFeedbackKey } from "@/features/cms/cmsRefreshFeedback";

type CmsBlockFormState = {
  pageKey: string;
  blockKey: string;
  blockType: CmsBlockType;
  sortOrder: string;
  status: CmsBlockStatus;
  settingsJson: string;
  mediaId: string;
  imageUrl: string;
  mediaKzId: string;
  imageKzUrl: string;
  mediaEnId: string;
  imageEnUrl: string;
  mobileMediaId: string;
  mobileImageUrl: string;
  mobileMediaKzId: string;
  mobileImageKzUrl: string;
  mobileMediaEnId: string;
  mobileImageEnUrl: string;
  linkType: CmsLinkType;
  linkTarget: string;
  linkOpenBehavior: CmsLinkOpenBehavior;
  titleRu: string;
  titleKz: string;
  titleEn: string;
  subtitleRu: string;
  subtitleKz: string;
  subtitleEn: string;
  descriptionRu: string;
  descriptionKz: string;
  descriptionEn: string;
  buttonTextRu: string;
  buttonTextKz: string;
  buttonTextEn: string;
  altTextRu: string;
  altTextKz: string;
  altTextEn: string;
  extraJsonRu: string;
  extraJsonKz: string;
  extraJsonEn: string;
};

const locales: CrmLocale[] = ["ru", "kz", "en"];
const blockTypes: CmsBlockType[] = [
  "HERO_SLIDER",
  "BANNER",
  "TEXT_BLOCK",
  "IMAGE_TEXT_BLOCK",
  "LINK_CARD",
  "MARKETPLACE_LINK",
  "FOOTER_LINK_GROUP",
  "CUSTOM_JSON",
];
const linkTypes: CmsLinkType[] = [
  "NONE",
  "INTERNAL_ROUTE",
  "EXTERNAL_URL",
  "CATALOG_CATEGORY",
  "CATALOG_FILTER",
  "BRAND_PAGE",
  "PRODUCT_PAGE",
];
const linkOpenBehaviors: CmsLinkOpenBehavior[] = ["SAME_TAB", "NEW_TAB"];
const supportedImageExtensionsByType: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};
const maxImageSizeBytes = 10 * 1024 * 1024;

const emptyForm: CmsBlockFormState = {
  pageKey: "",
  blockKey: "",
  blockType: "BANNER",
  sortOrder: "0",
  status: "PUBLISHED",
  settingsJson: "",
  mediaId: "",
  imageUrl: "",
  mediaKzId: "",
  imageKzUrl: "",
  mediaEnId: "",
  imageEnUrl: "",
  mobileMediaId: "",
  mobileImageUrl: "",
  mobileMediaKzId: "",
  mobileImageKzUrl: "",
  mobileMediaEnId: "",
  mobileImageEnUrl: "",
  linkType: "NONE",
  linkTarget: "",
  linkOpenBehavior: "SAME_TAB",
  titleRu: "",
  titleKz: "",
  titleEn: "",
  subtitleRu: "",
  subtitleKz: "",
  subtitleEn: "",
  descriptionRu: "",
  descriptionKz: "",
  descriptionEn: "",
  buttonTextRu: "",
  buttonTextKz: "",
  buttonTextEn: "",
  altTextRu: "",
  altTextKz: "",
  altTextEn: "",
  extraJsonRu: "",
  extraJsonKz: "",
  extraJsonEn: "",
};

export function CmsView() {
  const { locale, messages, t } = useI18n();
  const notifications = useNotifications();
  const [pages, setPages] = useState<CmsPageSummary[]>([]);
  const [selectedPageKey, setSelectedPageKey] = useState<string>("");
  const [page, setPage] = useState<CmsPage | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyBlockId, setBusyBlockId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [imageVariantVisibility, setImageVariantVisibility] = useState<Record<string, boolean>>({});
  const [blockPendingDelete, setBlockPendingDelete] = useState<CmsBlock | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<CmsBlockFormState>({
    defaultValues: emptyForm,
  });
  const form = (useWatch({ control }) ?? emptyForm) as CmsBlockFormState;
  const uploading = uploadingSlot !== null;
  const blockSchema = cmsBlockSchemas[form.blockType];
  const editorKey = isCreating ? "new" : String(selectedBlockId ?? "none");
  const hasStoredImageVariants = Boolean(
    form.mediaKzId ||
    form.mediaEnId ||
    form.mobileMediaId ||
    form.mobileMediaKzId ||
    form.mobileMediaEnId
  );
  const showImageVariants = imageVariantVisibility[editorKey] ?? hasStoredImageVariants;

  const selectedBlock = useMemo(() => {
    if (!page || selectedBlockId === null) {
      return null;
    }

    return page.blocks.find((block) => block.id === selectedBlockId) ?? null;
  }, [page, selectedBlockId]);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const nextPages = await crmApi.cmsPages();
      setPages(nextPages);
      setSelectedPageKey((current) => current || nextPages[0]?.pageKey || "");
      setError(null);
    } catch (error) {
      setError(getCrmErrorMessage(error, t("cms.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadPage = useCallback(async (pageKey: string) => {
    if (!pageKey) {
      return;
    }

    setPageLoading(true);
    try {
      const nextPage = await crmApi.cmsPage(pageKey);
      setPage(nextPage);
      setSelectedBlockId((current) => {
        if (current && nextPage.blocks.some((block) => block.id === current)) {
          return current;
        }
        return nextPage.blocks[0]?.id ?? null;
      });
      setIsCreating(false);
      setError(null);
    } catch (error) {
      setError(getCrmErrorMessage(error, t("cms.loadError")));
    } finally {
      setPageLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadPages();
      }
    });
    return () => {
      active = false;
    };
  }, [loadPages]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active && selectedPageKey) {
        void loadPage(selectedPageKey);
      }
    });
    return () => {
      active = false;
    };
  }, [loadPage, selectedPageKey]);

  useEffect(() => {
    if (isCreating && page) {
      reset(newBlockForm(page));
      return;
    }

    if (selectedBlock) {
      reset(blockToForm(selectedBlock));
    }
  }, [isCreating, page, reset, selectedBlock]);

  const updateField = <FieldName extends keyof CmsBlockFormState>(
    field: FieldName,
    value: CmsBlockFormState[FieldName]
  ) => {
    setValue(field, value as never, { shouldDirty: true });
    setError(null);
  };

  const startCreate = () => {
    if (!page) {
      return;
    }
    setSelectedBlockId(null);
    setIsCreating(true);
    setError(null);
  };

  const selectBlock = (blockId: number) => {
    setSelectedBlockId(blockId);
    setIsCreating(false);
    setError(null);
  };

  const selectPage = (pageKey: string) => {
    setSelectedPageKey(pageKey);
    setSelectedBlockId(null);
    setIsCreating(false);
    setError(null);
  };

  const save = async (values: CmsBlockFormState) => {
    if (saving || uploading || !page) {
      return;
    }

    const validationError = validateForm(values, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(values);
      const saved = selectedBlock && !isCreating
        ? await crmApi.updateCmsBlock(selectedBlock.id, payload)
        : await crmApi.createCmsBlock(payload);

      notifyCmsMutation(saved, notifications, t("cms.saved"), t, {draftWarning: true});
      setSelectedBlockId(saved.id);
      setIsCreating(false);
      await loadPage(saved.pageKey);
      await loadPages();
    } catch (error) {
      const message = getCrmErrorMessage(error, t("cms.saveError"));
      setError(message);
      notifications.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBlock = async (block: CmsBlock) => {
    if (busyBlockId) {
      return;
    }

    setBusyBlockId(block.id);
    try {
      const deletedBlock = await crmApi.deleteCmsBlock(block.id);
      notifyCmsMutation(deletedBlock, notifications, t("cms.deleted"), t, {draftWarning: false});
      setSelectedBlockId(null);
      await loadPage(block.pageKey);
      await loadPages();
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("cms.deleteError")));
    } finally {
      setBusyBlockId(null);
    }
  };

  const confirmDeleteBlock = async () => {
    if (!blockPendingDelete) return;

    await deleteBlock(blockPendingDelete);
    setBlockPendingDelete(null);
  };

  const togglePublish = async (block: CmsBlock) => {
    if (busyBlockId) {
      return;
    }

    setBusyBlockId(block.id);
    try {
      const nextBlock = block.status === "PUBLISHED"
        ? await crmApi.unpublishCmsBlock(block.id)
        : await crmApi.publishCmsBlock(block.id);
      notifyCmsMutation(
        nextBlock,
        notifications,
        nextBlock.status === "PUBLISHED" ? t("cms.published") : t("cms.unpublished"),
        t,
        {draftWarning: nextBlock.status === "DRAFT"}
      );
      await loadPage(nextBlock.pageKey);
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("cms.publishError")));
    } finally {
      setBusyBlockId(null);
    }
  };

  const moveBlock = async (block: CmsBlock, delta: number) => {
    if (busyBlockId) {
      return;
    }

    setBusyBlockId(block.id);
    try {
      const nextBlock = await crmApi.reorderCmsBlock(block.id, Math.max(0, block.sortOrder + delta));
      notifyCmsMutation(nextBlock, notifications, t("cms.reordered"), t, {draftWarning: false});
      await loadPage(nextBlock.pageKey);
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("cms.reorderError")));
    } finally {
      setBusyBlockId(null);
    }
  };

  if (loading) {
    return <Text tone="muted">{t("common.loading")}</Text>;
  }

  return (
    <section className="crm-page cms-workspace">
      <Text tone="muted">{t("cms.pageSubtitle")}</Text>
      {error && <Text className="crm-form-error">{error}</Text>}

      <div className="cms-layout">
        <aside className="crm-panel cms-sidebar-panel">
          <div className="crm-panel__header">
            <Heading as="h2" size="title">{t("cms.pages")}</Heading>
          </div>
          <div className="crm-panel__body cms-page-list">
            {pages.length === 0 ? (
              <Text tone="muted">{t("common.empty")}</Text>
            ) : pages.map((item) => (
              <button
                key={item.pageKey}
                type="button"
                className={cx("cms-page-button", selectedPageKey === item.pageKey && "cms-page-button--active")}
                onClick={() => selectPage(item.pageKey)}
              >
                <span>{pageLabel(item.pageKey, messages.cms.pageLabels, item.title)}</span>
                <span className="crm-chip">{item.blockCount}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="crm-panel cms-block-panel">
          <div className="crm-panel__header">
            <div>
              <Heading as="h2" size="title">{t("cms.blocks")}</Heading>
              {page && <Text tone="muted" size="small">{pageLabel(page.pageKey, messages.cms.pageLabels, page.title)}</Text>}
            </div>
            <Button type="button" onClick={startCreate}>{t("cms.addBlock")}</Button>
          </div>
          <div className="crm-panel__body">
            {pageLoading ? (
              <Text tone="muted">{t("common.loading")}</Text>
            ) : !page || page.blocks.length === 0 ? (
              <div className="crm-empty">
                <Text tone="muted">{t("cms.emptyBlocks")}</Text>
              </div>
            ) : (
              <div className="cms-block-list">
                {page.blocks.map((block) => (
                  <article
                    key={block.id}
                    className={cx("cms-block-card", selectedBlockId === block.id && !isCreating && "cms-block-card--active")}
                  >
                    <button type="button" className="cms-block-card__main" onClick={() => selectBlock(block.id)}>
                      <span>{blockLabel(block, messages.cms.blockLabels)}</span>
                      <Text as="span" tone="muted" size="caption">{block.blockKey}</Text>
                    </button>
                    <div className="cms-block-card__meta">
                      <span className={cx("crm-chip", block.status === "PUBLISHED" ? "crm-chip--success" : "crm-chip--warning")}>
                        {messages.cms.statuses[block.status]}
                      </span>
                      <span className="crm-chip">{block.sortOrder}</span>
                    </div>
                    <div className="crm-inline-actions">
                      <Button type="button" variant="secondary" disabled={busyBlockId !== null} onClick={() => moveBlock(block, -10)}>
                        {t("cms.moveUp")}
                      </Button>
                      <Button type="button" variant="secondary" disabled={busyBlockId !== null} onClick={() => moveBlock(block, 10)}>
                        {t("cms.moveDown")}
                      </Button>
                      <Button type="button" variant="secondary" disabled={busyBlockId !== null} onClick={() => togglePublish(block)}>
                        {block.status === "PUBLISHED" ? t("cms.unpublish") : t("cms.publish")}
                      </Button>
                      <Button type="button" variant="danger" disabled={busyBlockId !== null} onClick={() => setBlockPendingDelete(block)}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <form className="crm-panel cms-editor-panel" onSubmit={handleSubmit(save)}>
          <div className="crm-panel__header">
            <div>
              <Heading as="h2" size="title">
                {isCreating ? t("cms.newBlock") : selectedBlock ? blockLabel(selectedBlock, messages.cms.blockLabels) : t("cms.editor")}
              </Heading>
              <Text tone="muted" size="small">{t("cms.editorHint")}</Text>
            </div>
            <Button type="submit" isLoading={saving || uploading} disabled={!page || (!selectedBlock && !isCreating)}>
              {saving || uploading ? t("common.loading") : t("common.save")}
            </Button>
          </div>

          <div className="crm-panel__body cms-editor-body">
            {!page || (!selectedBlock && !isCreating) ? (
              <div className="crm-empty">
                <Text tone="muted">{t("cms.pickBlock")}</Text>
              </div>
            ) : (
              <>
                <section className="cms-editor-section">
                  <Heading as="h3" size="title">{t("cms.core")}</Heading>
                  <div className="crm-grid crm-grid--form">
                    <TextField id="blockKey" label={t("cms.blockKey")} value={form.blockKey} onChange={(value) => updateField("blockKey", value)} />
                    <NumberField id="sortOrder" label={t("cms.sortOrder")} value={form.sortOrder} onChange={(value) => updateField("sortOrder", value)} />
                    <SelectField id="blockType" label={t("cms.blockType")} value={form.blockType} onChange={(value) => updateField("blockType", value as CmsBlockType)}>
                      {blockTypes.map((type) => (
                        <option key={type} value={type}>{messages.cms.blockTypes[type]}</option>
                      ))}
                    </SelectField>
                    <SelectField id="status" label={t("cms.status")} value={form.status} onChange={(value) => updateField("status", value as CmsBlockStatus)}>
                      <option value="PUBLISHED">{messages.cms.statuses.PUBLISHED}</option>
                      <option value="DRAFT">{messages.cms.statuses.DRAFT}</option>
                    </SelectField>
                  </div>
                </section>

                {blockSchema.supportsImage && (
                  <section className="cms-editor-section">
                    <Heading as="h3" size="title">{t("cms.image")}</Heading>
                    <CmsImageUploadField
                      key={`${selectedBlockId ?? "new"}-default`}
                      slot="default"
                      label={t("cms.defaultImage")}
                      mediaId={form.mediaId}
                      imageUrl={form.imageUrl}
                      disabled={saving || uploading}
                      t={t}
                      notifications={notifications}
                      onUploadingChange={setUploadingSlot}
                      onChange={(mediaId, imageUrl) => {
                        updateField("mediaId", mediaId);
                        updateField("imageUrl", imageUrl);
                      }}
                    />

                    {(blockSchema.supportsLocalizedImages || blockSchema.supportsMobileImage) && (
                      <div className="crm-inline-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setImageVariantVisibility((current) => ({
                            ...current,
                            [editorKey]: !showImageVariants,
                          }))}
                        >
                          {showImageVariants ? t("cms.hideImageVariants") : t("cms.addImageVariants")}
                        </Button>
                      </div>
                    )}

                    {showImageVariants && (
                      <div className="cms-image-variant-stack">
                        {blockSchema.supportsLocalizedImages && (
                          <div className="cms-image-variant-group">
                            <Text tone="muted" size="caption">{t("cms.desktopImageVariants")}</Text>
                            <div className="crm-grid">
                              <CmsImageUploadField
                                key={`${selectedBlockId ?? "new"}-desktop-kz`}
                                slot="desktop-kz"
                                label={t("cms.kzImage")}
                                mediaId={form.mediaKzId}
                                imageUrl={form.imageKzUrl}
                                disabled={saving || uploading}
                                t={t}
                                notifications={notifications}
                                onUploadingChange={setUploadingSlot}
                                onChange={(mediaId, imageUrl) => {
                                  updateField("mediaKzId", mediaId);
                                  updateField("imageKzUrl", imageUrl);
                                }}
                              />
                              <CmsImageUploadField
                                key={`${selectedBlockId ?? "new"}-desktop-en`}
                                slot="desktop-en"
                                label={t("cms.enImage")}
                                mediaId={form.mediaEnId}
                                imageUrl={form.imageEnUrl}
                                disabled={saving || uploading}
                                t={t}
                                notifications={notifications}
                                onUploadingChange={setUploadingSlot}
                                onChange={(mediaId, imageUrl) => {
                                  updateField("mediaEnId", mediaId);
                                  updateField("imageEnUrl", imageUrl);
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {blockSchema.supportsMobileImage && (
                          <div className="cms-image-variant-group">
                            <Text tone="muted" size="caption">{t("cms.mobileImageVariants")}</Text>
                            <div className="crm-grid">
                              <CmsImageUploadField
                                key={`${selectedBlockId ?? "new"}-mobile-ru`}
                                slot="mobile-ru"
                                label={t("cms.mobileRuImage")}
                                mediaId={form.mobileMediaId}
                                imageUrl={form.mobileImageUrl}
                                disabled={saving || uploading}
                                t={t}
                                notifications={notifications}
                                onUploadingChange={setUploadingSlot}
                                onChange={(mediaId, imageUrl) => {
                                  updateField("mobileMediaId", mediaId);
                                  updateField("mobileImageUrl", imageUrl);
                                }}
                              />
                              {blockSchema.supportsLocalizedImages && (
                                <>
                                  <CmsImageUploadField
                                    key={`${selectedBlockId ?? "new"}-mobile-kz`}
                                    slot="mobile-kz"
                                    label={t("cms.mobileKzImage")}
                                    mediaId={form.mobileMediaKzId}
                                    imageUrl={form.mobileImageKzUrl}
                                    disabled={saving || uploading}
                                    t={t}
                                    notifications={notifications}
                                    onUploadingChange={setUploadingSlot}
                                    onChange={(mediaId, imageUrl) => {
                                      updateField("mobileMediaKzId", mediaId);
                                      updateField("mobileImageKzUrl", imageUrl);
                                    }}
                                  />
                                  <CmsImageUploadField
                                    key={`${selectedBlockId ?? "new"}-mobile-en`}
                                    slot="mobile-en"
                                    label={t("cms.mobileEnImage")}
                                    mediaId={form.mobileMediaEnId}
                                    imageUrl={form.mobileImageEnUrl}
                                    disabled={saving || uploading}
                                    t={t}
                                    notifications={notifications}
                                    onUploadingChange={setUploadingSlot}
                                    onChange={(mediaId, imageUrl) => {
                                      updateField("mobileMediaEnId", mediaId);
                                      updateField("mobileImageEnUrl", imageUrl);
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {blockSchema.supportsLink && (
                  <section className="cms-editor-section">
                    <Heading as="h3" size="title">{t("cms.link")}</Heading>
                    <div className="crm-grid crm-grid--form">
                      <SelectField id="linkType" label={t("cms.linkType")} value={form.linkType} onChange={(value) => updateField("linkType", value as CmsLinkType)}>
                        {linkTypes.map((type) => (
                          <option key={type} value={type}>{messages.cms.linkTypes[type]}</option>
                        ))}
                      </SelectField>
                      <TextField id="linkTarget" label={t("cms.linkTarget")} value={form.linkTarget} onChange={(value) => updateField("linkTarget", value)} />
                      <SelectField id="linkOpenBehavior" label={t("cms.linkOpenBehavior")} value={form.linkOpenBehavior} onChange={(value) => updateField("linkOpenBehavior", value as CmsLinkOpenBehavior)}>
                        {linkOpenBehaviors.map((behavior) => (
                          <option key={behavior} value={behavior}>{messages.cms.linkOpenBehaviors[behavior]}</option>
                        ))}
                      </SelectField>
                    </div>
                  </section>
                )}

                {(blockSchema.supportsText || blockSchema.supportsAltText || blockSchema.supportsButton || blockSchema.supportsExtraJson) && (
                  <section className="cms-editor-section">
                    <Heading as="h3" size="title">{t("cms.translations")}</Heading>
                    <div className="cms-locale-grid">
                      {locales.map((lang) => (
                        <TranslationFields key={lang} lang={lang} form={form} schema={blockSchema} messages={messages.cms} updateField={updateField} />
                      ))}
                    </div>
                  </section>
                )}

                {blockSchema.supportsSettings && (
                  <section className="cms-editor-section">
                    <Heading as="h3" size="title">{t("cms.advanced")}</Heading>
                    <TextAreaField id="settingsJson" label={t("cms.settingsJson")} value={form.settingsJson} onChange={(value) => updateField("settingsJson", value)} />
                  </section>
                )}

                <section className="cms-editor-section">
                  <Heading as="h3" size="title">{t("cms.preview")}</Heading>
                  <CmsPreview form={form} locale={locale} schema={blockSchema} messages={messages.cms} />
                </section>
              </>
            )}
          </div>
        </form>
      </div>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        isLoading={blockPendingDelete ? busyBlockId === blockPendingDelete.id : false}
        open={blockPendingDelete !== null}
        title={t("cms.deleteConfirm")}
        onConfirm={confirmDeleteBlock}
        onOpenChange={(open) => {
          if (!open && !busyBlockId) {
            setBlockPendingDelete(null);
          }
        }}
      />
    </section>
  );
}

function notifyCmsMutation(
  block: CmsBlock,
  notifications: ReturnType<typeof useNotifications>,
  successMessage: string,
  t: (key: string) => string,
  options: { draftWarning: boolean }
) {
  notifications.success(successMessage);

  if (options.draftWarning && block.status === "DRAFT") {
    notifications.warning(t("cms.savedDraft"));
  }

  const cacheRefresh = block.publicCacheRefresh;
  const refreshFeedbackKey = cmsRefreshFeedbackKey(cacheRefresh);
  if (refreshFeedbackKey) {
    notifications.warning(t(refreshFeedbackKey));
  }
}

function TranslationFields({
  lang,
  form,
  schema,
  messages,
  updateField,
}: {
  lang: CrmLocale;
  form: CmsBlockFormState;
  schema: CmsBlockSchema;
  messages: ReturnType<typeof useI18n>["messages"]["cms"];
  updateField: <FieldName extends keyof CmsBlockFormState>(field: FieldName, value: CmsBlockFormState[FieldName]) => void;
}) {
  const suffix = localeSuffix(lang);
  const titleKey = `title${suffix}` as const;
  const subtitleKey = `subtitle${suffix}` as const;
  const descriptionKey = `description${suffix}` as const;
  const buttonTextKey = `buttonText${suffix}` as const;
  const altTextKey = `altText${suffix}` as const;
  const extraJsonKey = `extraJson${suffix}` as const;

  return (
    <article className="cms-locale-panel">
      <Heading as="h3" size="title">{messages.locales[lang]}</Heading>
      {schema.supportsText && (
        <>
          <TextField id={titleKey} label={messages.title} value={form[titleKey]} onChange={(value) => updateField(titleKey, value)} />
          <TextField id={subtitleKey} label={messages.subtitle} value={form[subtitleKey]} onChange={(value) => updateField(subtitleKey, value)} />
          <TextAreaField id={descriptionKey} label={messages.description} value={form[descriptionKey]} onChange={(value) => updateField(descriptionKey, value)} />
        </>
      )}
      {schema.supportsButton && (
        <TextField id={buttonTextKey} label={messages.buttonText} value={form[buttonTextKey]} onChange={(value) => updateField(buttonTextKey, value)} />
      )}
      {schema.supportsAltText && (
        <TextField id={altTextKey} label={messages.altText} value={form[altTextKey]} onChange={(value) => updateField(altTextKey, value)} />
      )}
      {schema.supportsExtraJson && (
        <TextAreaField id={extraJsonKey} label={messages.extraJson} value={form[extraJsonKey]} onChange={(value) => updateField(extraJsonKey, value)} />
      )}
    </article>
  );
}

function CmsPreview({
  form,
  locale,
  schema,
  messages,
}: {
  form: CmsBlockFormState;
  locale: CrmLocale;
  schema: CmsBlockSchema;
  messages: ReturnType<typeof useI18n>["messages"]["cms"];
}) {
  const [mobilePreview, setMobilePreview] = useState(false);
  const translation = translationFromForm(form, locale);
  const desktopPreviewUrl = imageUrlForPreview(form, locale);
  const mobilePreviewUrl = imageUrlForPreview(form, locale, true);
  const canPreviewMobile = schema.supportsMobileImage
    && Boolean(mobilePreviewUrl)
    && mobilePreviewUrl !== desktopPreviewUrl;
  const imageUrl = mobilePreview && canPreviewMobile ? mobilePreviewUrl : desktopPreviewUrl;
  const hasImage = schema.supportsImage && Boolean(imageUrl);
  const hasButton = schema.supportsButton && form.linkType !== "NONE" && Boolean(form.linkTarget.trim()) && Boolean(translation.buttonText.trim());

  if (!schema.supportsImage) {
    return (
      <article className="cms-preview-card">
        <Text tone="muted" size="caption">{messages.blockTypes[form.blockType]}</Text>
        {schema.supportsText && translation.title && <Heading as="h3" size="title">{translation.title}</Heading>}
        {schema.supportsText && translation.subtitle && <Text tone="muted">{translation.subtitle}</Text>}
        {schema.supportsText && translation.description && <Text className="cms-preview-description">{translation.description}</Text>}
        {schema.supportsExtraJson && translation.extraJson && <Text className="cms-preview-description">{translation.extraJson}</Text>}
      </article>
    );
  }

  return (
    <div className="crm-grid">
      {canPreviewMobile && (
        <div className="crm-inline-actions">
          <Button type="button" variant={mobilePreview ? "secondary" : "primary"} onClick={() => setMobilePreview(false)}>
            {messages.desktopPreview}
          </Button>
          <Button type="button" variant={mobilePreview ? "primary" : "secondary"} onClick={() => setMobilePreview(true)}>
            {messages.mobilePreview}
          </Button>
        </div>
      )}
      <article className={cx("cms-preview-hero", mobilePreview && "cms-preview-hero--mobile")}>
        {hasImage ? (
          <img className="cms-preview-hero__image" src={imageUrl} alt={translation.altText || messages.previewImageAlt} />
        ) : (
          <div className="cms-preview-hero__empty">
            <Text tone="muted">{messages.noImage}</Text>
          </div>
        )}
        <div className="cms-preview-hero__overlay">
          <Text tone="inverse" size="caption">{messages.blockTypes[form.blockType]}</Text>
          {schema.supportsText && translation.title && <Heading as="h3" size="title" className="cms-preview-hero__title">{translation.title}</Heading>}
          {schema.supportsText && translation.subtitle && <Text tone="inverse">{translation.subtitle}</Text>}
          {schema.supportsText && translation.description && <Text tone="inverse" className="cms-preview-description">{translation.description}</Text>}
          {hasButton && <span className="cms-preview-button">{translation.buttonText}</span>}
        </div>
      </article>
    </div>
  );
}

function CmsImageUploadField({
  slot,
  label,
  mediaId,
  imageUrl,
  disabled,
  t,
  notifications,
  onUploadingChange,
  onChange,
}: {
  slot: string;
  label: string;
  mediaId: string;
  imageUrl: string;
  disabled: boolean;
  t: (key: string) => string;
  notifications: ReturnType<typeof useNotifications>;
  onUploadingChange: (slot: string | null) => void;
  onChange: (mediaId: string, imageUrl: string) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const validationError = validateImage(file, t);
    if (validationError) {
      event.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);
      notifications.error(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const upload = async () => {
    if (!selectedFile || disabled) {
      return;
    }

    onUploadingChange(slot);
    try {
      const media = await crmApi.uploadCmsMedia(selectedFile);
      onChange(String(media.id), media.url ?? "");
      setSelectedFile(null);
      setPreviewUrl(null);
      notifications.success(t("cms.imageUploaded"));
    } catch (error) {
      notifications.error(getCrmErrorMessage(error, t("cms.imageUploadError")));
    } finally {
      onUploadingChange(null);
    }
  };

  return (
    <article className="cms-image-variant">
      <Heading as="h3" size="title">{label}</Heading>
      <div className="cms-preview-image-wrap">
        {previewUrl || imageUrl ? (
          <img className="cms-preview-image" src={previewUrl ?? imageUrl} alt={t("cms.previewImageAlt")} />
        ) : (
          <div className="crm-empty">
            <Text tone="muted">{t("cms.noImage")}</Text>
          </div>
        )}
      </div>
      <Field htmlFor={`cmsImage-${slot}`} label={t("cms.chooseImage")}>
        <input
          id={`cmsImage-${slot}`}
          className="crm-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled}
          onChange={selectImage}
        />
      </Field>
      <div className="crm-inline-actions">
        <Button type="button" isLoading={disabled && Boolean(selectedFile)} disabled={!selectedFile || disabled} onClick={upload}>
          {t("cms.uploadImage")}
        </Button>
        <Button type="button" variant="secondary" disabled={!mediaId || disabled} onClick={() => onChange("", "")}>
          {t("cms.removeImage")}
        </Button>
      </div>
    </article>
  );
}

function TextField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <input id={id} className="crm-input" value={value} onChange={(event) => onChange(event.target.value)} />
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

function TextAreaField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field htmlFor={id} label={label}>
      <textarea id={id} className="crm-textarea" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Field htmlFor={id} label={label}>
      <select id={id} className="crm-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </Field>
  );
}

function newBlockForm(page: CmsPage): CmsBlockFormState {
  const nextSortOrder = page.blocks.reduce((max, block) => Math.max(max, block.sortOrder), 0) + 10;
  return {
    ...emptyForm,
    pageKey: page.pageKey,
    blockKey: `${page.pageKey}.newBlock`,
    sortOrder: String(nextSortOrder),
  };
}

function blockToForm(block: CmsBlock): CmsBlockFormState {
  return {
    ...emptyForm,
    pageKey: block.pageKey,
    blockKey: block.blockKey,
    blockType: block.blockType,
    sortOrder: String(block.sortOrder),
    status: block.status,
    settingsJson: block.settingsJson ?? "",
    mediaId: block.media?.id ? String(block.media.id) : "",
    imageUrl: block.media?.url ?? "",
    mediaKzId: block.mediaKz?.id ? String(block.mediaKz.id) : "",
    imageKzUrl: block.mediaKz?.url ?? "",
    mediaEnId: block.mediaEn?.id ? String(block.mediaEn.id) : "",
    imageEnUrl: block.mediaEn?.url ?? "",
    mobileMediaId: block.mobileMedia?.id ? String(block.mobileMedia.id) : "",
    mobileImageUrl: block.mobileMedia?.url ?? "",
    mobileMediaKzId: block.mobileMediaKz?.id ? String(block.mobileMediaKz.id) : "",
    mobileImageKzUrl: block.mobileMediaKz?.url ?? "",
    mobileMediaEnId: block.mobileMediaEn?.id ? String(block.mobileMediaEn.id) : "",
    mobileImageEnUrl: block.mobileMediaEn?.url ?? "",
    linkType: block.linkType,
    linkTarget: block.linkTarget ?? "",
    linkOpenBehavior: block.linkOpenBehavior,
    ...translationFields(block, "ru"),
    ...translationFields(block, "kz"),
    ...translationFields(block, "en"),
  };
}

function translationFields(block: CmsBlock, lang: CrmLocale) {
  const translation = block.translations[lang];
  const suffix = localeSuffix(lang);
  const titleKey = `title${suffix}` as const;
  const subtitleKey = `subtitle${suffix}` as const;
  const descriptionKey = `description${suffix}` as const;
  const buttonTextKey = `buttonText${suffix}` as const;
  const altTextKey = `altText${suffix}` as const;
  const extraJsonKey = `extraJson${suffix}` as const;

  return {
    [titleKey]: translation?.title ?? "",
    [subtitleKey]: translation?.subtitle ?? "",
    [descriptionKey]: translation?.description ?? "",
    [buttonTextKey]: translation?.buttonText ?? "",
    [altTextKey]: translation?.altText ?? "",
    [extraJsonKey]: translation?.extraJson ?? "",
  };
}

function toPayload(form: CmsBlockFormState): CmsBlockPayload {
  const schema = cmsBlockSchemas[form.blockType];
  return {
    pageKey: form.pageKey,
    blockKey: form.blockKey.trim(),
    blockType: form.blockType,
    sortOrder: Number(form.sortOrder || 0),
    status: form.status,
    settingsJson: schema.supportsSettings ? form.settingsJson.trim() || null : null,
    mediaId: schema.supportsImage && form.mediaId ? Number(form.mediaId) : null,
    mediaKzId: schema.supportsLocalizedImages && form.mediaKzId ? Number(form.mediaKzId) : null,
    mediaEnId: schema.supportsLocalizedImages && form.mediaEnId ? Number(form.mediaEnId) : null,
    mobileMediaId: schema.supportsMobileImage && form.mobileMediaId ? Number(form.mobileMediaId) : null,
    mobileMediaKzId: schema.supportsMobileImage && schema.supportsLocalizedImages && form.mobileMediaKzId ? Number(form.mobileMediaKzId) : null,
    mobileMediaEnId: schema.supportsMobileImage && schema.supportsLocalizedImages && form.mobileMediaEnId ? Number(form.mobileMediaEnId) : null,
    linkType: schema.supportsLink ? form.linkType : "NONE",
    linkTarget: schema.supportsLink ? form.linkTarget.trim() || null : null,
    linkOpenBehavior: form.linkOpenBehavior,
    translations: normalizeTranslationPayloads({
      ru: translationPayload(form, "ru", schema),
      kz: translationPayload(form, "kz", schema),
      en: translationPayload(form, "en", schema),
    }),
  };
}

function translationPayload(form: CmsBlockFormState, lang: CrmLocale, schema: CmsBlockSchema) {
  const translation = translationFromForm(form, lang);
  return {
    title: schema.supportsText ? translation.title.trim() || null : null,
    subtitle: schema.supportsText ? translation.subtitle.trim() || null : null,
    description: schema.supportsText ? translation.description.trim() || null : null,
    buttonText: schema.supportsButton ? translation.buttonText.trim() || null : null,
    altText: schema.supportsAltText ? translation.altText.trim() || null : null,
    extraJson: schema.supportsExtraJson ? translation.extraJson.trim() || null : null,
  };
}

function normalizeTranslationPayloads(
  translations: Record<string, CmsTranslationPayload>
): Record<string, CmsTranslationPayload> {
  return Object.entries(translations).reduce<Record<string, CmsTranslationPayload>>((normalized, [lang, translation]) => {
    const canonicalLang = normalizeTranslationLang(lang);
    if (!canonicalLang) {
      return normalized;
    }
    normalized[canonicalLang] = translation;
    return normalized;
  }, {});
}

function normalizeTranslationLang(lang: string): CrmLocale | null {
  const normalized = lang.trim().toLowerCase();
  if (normalized === "kk") {
    return "kz";
  }
  if (locales.includes(normalized as CrmLocale)) {
    return normalized as CrmLocale;
  }
  return null;
}

function translationFromForm(form: CmsBlockFormState, lang: CrmLocale) {
  const suffix = localeSuffix(lang);
  const titleKey = `title${suffix}` as const;
  const subtitleKey = `subtitle${suffix}` as const;
  const descriptionKey = `description${suffix}` as const;
  const buttonTextKey = `buttonText${suffix}` as const;
  const altTextKey = `altText${suffix}` as const;
  const extraJsonKey = `extraJson${suffix}` as const;

  return {
    title: form[titleKey],
    subtitle: form[subtitleKey],
    description: form[descriptionKey],
    buttonText: form[buttonTextKey],
    altText: form[altTextKey],
    extraJson: form[extraJsonKey],
  };
}

function validateForm(form: CmsBlockFormState, t: (key: string) => string) {
  const schema = cmsBlockSchemas[form.blockType];
  if (!form.blockKey.trim()) {
    return t("cms.blockKeyRequired");
  }
  if (!Number.isFinite(Number(form.sortOrder)) || Number(form.sortOrder) < 0) {
    return t("cms.sortOrderError");
  }
  if (schema.requiresImage && !form.mediaId) {
    return t("cms.imageRequired");
  }
  if (schema.requiresText) {
    const fallbackTranslation = translationFromForm(form, "ru");
    if (!fallbackTranslation.title.trim() && !fallbackTranslation.description.trim()) {
      return t("cms.textRequired");
    }
  }
  if (schema.supportsLink && form.linkType !== "NONE") {
    if (!form.linkTarget.trim()) {
      return t("cms.linkRequired");
    }
    if (form.linkType === "EXTERNAL_URL" && !isValidHttpUrl(form.linkTarget)) {
      return t("cms.externalUrlError");
    }
    if (form.linkType === "INTERNAL_ROUTE" && (!form.linkTarget.startsWith("/") || form.linkTarget.startsWith("//"))) {
      return t("cms.internalUrlError");
    }
  }
  return null;
}

function imageUrlForPreview(form: CmsBlockFormState, locale: CrmLocale, mobile = false) {
  const defaultDesktop = form.imageUrl;
  const defaultMobile = form.mobileImageUrl;
  const localizedDesktop = locale === "kz"
    ? form.imageKzUrl
    : locale === "en"
      ? form.imageEnUrl
      : defaultDesktop;

  if (!mobile) {
    return localizedDesktop || defaultDesktop;
  }

  const localizedMobile = locale === "kz"
    ? form.mobileImageKzUrl
    : locale === "en"
      ? form.mobileImageEnUrl
      : defaultMobile;

  return localizedMobile || localizedDesktop || defaultMobile || defaultDesktop;
}

function validateImage(file: File, t: (key: string) => string) {
  const allowedExtensions = supportedImageExtensionsByType[file.type];
  const fileName = file.name.toLowerCase();
  if (!allowedExtensions || !allowedExtensions.some((extension) => fileName.endsWith(extension))) {
    return t("cms.imageTypeError");
  }
  if (file.size > maxImageSizeBytes) {
    return t("cms.imageSizeError");
  }
  return null;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type LocaleSuffix = "Ru" | "Kz" | "En";

function localeSuffix(lang: CrmLocale): LocaleSuffix {
  return lang === "ru" ? "Ru" : lang === "kz" ? "Kz" : "En";
}

function pageLabel(pageKey: string, labels: Record<string, string>, fallback: string) {
  return labels[pageKey] ?? fallback;
}

function blockLabel(block: CmsBlock, labels: Record<string, string>) {
  return labels[block.blockKey] ?? block.blockKey;
}
