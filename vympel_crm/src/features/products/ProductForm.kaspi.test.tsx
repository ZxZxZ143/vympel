// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KaspiImportPreview, Product, References } from "@/shared/api/types";
import { ProductForm } from "./ProductForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  references: vi.fn(),
  importKaspiProduct: vi.fn(),
  createProduct: vi.fn(),
  createReference: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  translate: (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/shared/api/client", () => ({
  CrmApiError: class CrmApiError extends Error {
    code?: string;

    constructor(_status: number, message: string, code?: string) {
      super(message);
      this.code = code;
    }
  },
  crmApi: {
    references: mocks.references,
    importKaspiProduct: mocks.importKaspiProduct,
    createProduct: mocks.createProduct,
    createReference: mocks.createReference,
  },
}));

vi.mock("@/shared/feedback/NotificationProvider", () => ({
  useNotifications: () => ({ success: mocks.success, error: mocks.error }),
}));

vi.mock("@/shared/i18n/useI18n", () => ({
  useI18n: () => ({
    locale: "ru",
    t: mocks.translate,
    messages: {
      common: { yes: "common.yes", no: "common.no" },
      products: {
        statuses: { ACTIVE: "ACTIVE", DRAFT: "DRAFT", ARCHIVED: "ARCHIVED" },
        types: {
          WATCH: "WATCH",
          APPLE_CASE: "APPLE_CASE",
          ACCESSORY: "ACCESSORY",
          WALL_CLOCK: "WALL_CLOCK",
          FLOOR_CLOCK: "FLOOR_CLOCK",
        },
      },
    },
  }),
}));

const references: References = {
  categories: [{ id: 1, code: "WATCH_WRIST", name: "Watches", parentId: null }],
  brands: [
    { id: 10, code: "ROMANSON", name: "Romanson", countryId: 20, countryCode: "KR", countryName: "Korea" },
    { id: 11, code: "CASIO", name: "Casio", countryId: 21, countryCode: "JP", countryName: "Japan" },
  ],
  collections: [{ id: 33, name: "Heritage", code: "HERITAGE", brandId: 10 }],
  mechanisms: [{ id: 5, code: "QUARTZ", name: "Quartz" }],
  genders: [{ id: 6, code: "MEN", name: "Men" }],
  materials: [
    { id: 1, code: "STEEL", name: "Steel" },
    { id: 2, code: "STAINLESS_STEEL", name: "Stainless steel" },
    { id: 3, code: "LEATHER", name: "Leather" },
  ],
  glassTypes: [{ id: 4, code: "MINERAL", name: "Mineral" }],
  stoneInlays: [],
  countries: [
    { id: 20, code: "KR", name: "Korea" },
    { id: 21, code: "JP", name: "Japan" },
  ],
  interiorColors: [],
  interiorStyles: [],
  interiorMechanisms: [],
  interiorPowerTypes: [],
  watchDialTypes: [{ id: 31, name: "Аналоговый (стрелки)", code: "ANALOG" }],
  watchDialMarkings: [{ id: 32, name: "Штрихи", code: "MARKERS" }],
  watchPowerSources: [{ id: 33, name: "От батарейки", code: "BATTERY" }],
  watchWaterResistances: [{ id: 34, name: "WR50 (5 атм)", code: "WR50" }],
  watchFeatures: [{ id: 35, name: "Отображение даты", code: "DATE" }],
};

const preview: KaspiImportPreview = {
  source: "KASPI",
  sourceUrl: "https://kaspi.kz/shop/p/watch-123",
  categoryId: 1,
  categoryProfile: "WRISTWATCH",
  values: {
    nameRu: "Imported watch",
    brandId: 10,
    model: "TM9",
    price: 129990,
    descriptionRu: "Описание **Markdown**",
    kaspiUrl: "https://kaspi.kz/shop/p/watch-123",
    watchDetails: {
      mechanismId: 5,
      genderId: 6,
      caseMaterialId: null,
      strapMaterialId: 3,
      glassTypeId: 4,
      caseSizeMm: 40,
      waterResistance: null,
      stoneInlayId: null,
      dialTypeId: 31,
      dialMarkingId: 32,
      powerSourceId: 33,
      waterResistanceId: 34,
      strapColorId: null,
      dialColorId: null,
      packageContents: "часы",
      featureIds: [35],
    },
  },
  mappedFields: [
    { targetField: "nameRu", resolvedValue: "Imported watch" },
    { targetField: "price", resolvedValue: "129990" },
  ],
  mappedCharacteristics: [{
    sourceLabel: "Материал ремешка",
    sourceValue: "кожа",
    targetField: "watchDetails.strapMaterialId",
    resolvedValue: "Leather",
    resolution: "ALIAS",
  }],
  unmappedCharacteristics: [{ sourceLabel: "Цвет корпуса", sourceValue: "серебристый", reason: "UNSUPPORTED_FOR_CATEGORY" }],
  unresolvedCharacteristics: [{ sourceLabel: "Материал корпуса", sourceValue: "адамант", targetField: "watchDetails.caseMaterialId", reason: "UNRESOLVED_VALUE" }],
  warnings: ["UNMAPPED_CHARACTERISTICS_PRESENT", "UNRESOLVED_VALUES_PRESENT"],
};

describe("Kaspi product import flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.references.mockResolvedValue(references);
    mocks.createProduct.mockResolvedValue({ id: 101, status: "DRAFT", images: [] } as unknown as Product);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows import only after category selection and keeps Cancel side-effect free", async () => {
    render(<ProductForm />);

    expect(screen.queryByRole("button", { name: "products.kaspiImport" })).toBeNull();
    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));

    fireEvent.change(screen.getByLabelText("products.nameRu"), { target: { value: "Before import" } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    expect(screen.getByRole("dialog", { name: "products.kaspiImportTitle" })).toBeTruthy();

    const importUrl = screen.getByLabelText("products.kaspiImportUrl") as HTMLInputElement;
    fireEvent.change(importUrl, { target: { value: "not-a-url" } });
    fireEvent.submit(importUrl.form!);
    expect((await screen.findByRole("alert")).textContent).toContain("products.kaspiImportInvalidUrl");
    expect(importUrl.getAttribute("aria-invalid")).toBe("true");
    expect(importUrl.getAttribute("aria-describedby")).toContain(screen.getByRole("alert").id);

    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: "https://example.com/product" } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    expect((await screen.findByRole("alert")).textContent).toContain("products.kaspiImportInvalidUrl");

    mocks.importKaspiProduct.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve(preview), 25);
    }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    const loadingButton = screen.getByRole("button", { name: "products.kaspiImportLoading" }) as HTMLButtonElement;
    expect(loadingButton.disabled).toBe(true);
    fireEvent.click(loadingButton);
    expect(mocks.importKaspiProduct).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("products.kaspiImportMappedCharacteristics")).toBeTruthy();
    expect(screen.getByText("Материал ремешка:")).toBeTruthy();
    expect(screen.getByText("Цвет корпуса:")).toBeTruthy();
    expect(screen.getByText("Материал корпуса:")).toBeTruthy();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "common.cancel" })[1]);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((screen.getByLabelText("products.nameRu") as HTMLInputElement).value).toBe("Before import");
  });

  it("keeps the form unchanged when a later import fails after a successful preview", async () => {
    mocks.importKaspiProduct
      .mockResolvedValueOnce(preview)
      .mockRejectedValueOnce(new Error("network detail must not leak"));
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    fireEvent.change(screen.getByLabelText("products.nameRu"), { target: { value: "Manual value" } });

    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    const firstDialog = await screen.findByRole("dialog", { name: "products.kaspiImportTitle" });
    fireEvent.click(within(firstDialog).getAllByRole("button", { name: "common.cancel" })[1]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), {
      target: { value: "https://kaspi.kz/shop/p/watch-456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));

    expect((await screen.findByRole("alert")).textContent).toContain("products.kaspiImportError");
    expect((screen.getByLabelText("products.nameRu") as HTMLInputElement).value).toBe("Manual value");
  });

  it("applies mapped values to the editable RHF form, preserves unresolved values and submits normally", async () => {
    mocks.importKaspiProduct.mockResolvedValue(preview);
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    fireEvent.change(screen.getByLabelText("products.caseMaterial"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    fireEvent.click(await screen.findByRole("button", { name: "products.kaspiImportApply" }));

    await waitFor(() => expect((screen.getByLabelText("products.nameRu") as HTMLInputElement).value).toBe("Imported watch"));
    expect((screen.getByLabelText("products.price") as HTMLInputElement).value).toBe("129990");
    expect((screen.getByLabelText("products.kaspiUrl") as HTMLInputElement).value).toBe(preview.sourceUrl);
    expect((document.getElementById("descriptionRu") as HTMLTextAreaElement).value).toBe("Описание **Markdown**");
    expect((screen.getByLabelText("products.caseMaterial") as HTMLSelectElement).value).toBe("1");
    expect((screen.getByLabelText("products.strapMaterial") as HTMLSelectElement).value).toBe("3");
    expect((screen.getByLabelText("products.dialType") as HTMLSelectElement).value).toBe("31");
    expect((screen.getByLabelText("products.dialMarking") as HTMLSelectElement).value).toBe("32");
    expect((screen.getByLabelText("products.watchPowerSource") as HTMLSelectElement).value).toBe("33");
    expect((screen.getByLabelText("products.waterResistance") as HTMLSelectElement).value).toBe("34");
    expect((screen.getByLabelText("products.packageContents") as HTMLInputElement).value).toBe("часы");
    expect((screen.getByLabelText("Отображение даты") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("products.category") as HTMLSelectElement).value).toBe("1");

    fireEvent.change(screen.getByLabelText("products.nameRu"), { target: { value: "Manually edited" } });
    expect((screen.getByLabelText("products.nameRu") as HTMLInputElement).value).toBe("Manually edited");
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() => expect(mocks.createProduct).toHaveBeenCalledTimes(1));
    expect(mocks.createProduct.mock.calls[0][0]).toMatchObject({
      productName: { name_ru: "Manually edited" },
      model: "TM9",
      price: 129990,
      categoryId: 1,
      brandId: 10,
      kaspiUrl: preview.sourceUrl,
      watchDetails: {
        caseMaterialId: 1,
        strapMaterialId: 3,
        mechanismId: 5,
        dialTypeId: 31,
        dialMarkingId: 32,
        powerSourceId: 33,
        waterResistanceId: 34,
        packageContents: "часы",
        featureIds: [35],
      },
    });
  });

  it("creates a missing reference once, merges it locally and selects it without a reload", async () => {
    mocks.createReference.mockResolvedValue({ id: 90, name: "Перламутровый", code: "CRM_TEST" });
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    const dialSelect = screen.getByLabelText("products.dialType") as HTMLSelectElement;
    fireEvent.click(within(dialSelect.parentElement!).getByRole("button", { name: "products.referenceAdd" }));
    const dialog = screen.getByRole("dialog", { name: "products.referenceCreateTitle" });
    fireEvent.change(within(dialog).getByLabelText("products.referenceNameRu"), { target: { value: "Перламутровый" } });
    fireEvent.submit(within(dialog).getByLabelText("products.referenceNameRu").closest("form")!);

    await waitFor(() => expect(mocks.createReference).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const selectedDial = await screen.findByLabelText("products.dialType") as HTMLSelectElement;
    await waitFor(() => expect(Array.from(selectedDial.options).map((option) => option.value)).toContain("90"));
    await waitFor(() => expect(selectedDial.value).toBe("90"));
    expect(Array.from(selectedDial.options).some((option) => option.text === "Перламутровый")).toBe(true);
    expect(mocks.createReference).toHaveBeenCalledWith(
      "watch-dial-types",
      { ru: "Перламутровый", kz: "", en: "" },
      "ru"
    );
  });

  it("cancels inline creation without a mutation and can immediately select a created feature", async () => {
    mocks.createReference.mockResolvedValue({ id: 91, name: "Новый календарь", code: "CRM_FEATURE" });
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    const features = document.getElementById("featureIds")!;
    fireEvent.click(within(features).getByRole("button", { name: "products.referenceAdd" }));
    fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "common.cancel" })[1]);
    expect(mocks.createReference).not.toHaveBeenCalled();

    fireEvent.click(within(features).getByRole("button", { name: "products.referenceAdd" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("products.referenceNameRu"), { target: { value: "Новый календарь" } });
    fireEvent.submit(within(dialog).getByLabelText("products.referenceNameRu").closest("form")!);
    expect((await screen.findByLabelText("Новый календарь") as HTMLInputElement).checked).toBe(true);
  });

  it("prevents a synchronous double submit and keeps a duplicate error in the dialog", async () => {
    let rejectRequest: ((reason: unknown) => void) | undefined;
    mocks.createReference.mockImplementation(() => new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }));
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    const dialSelect = screen.getByLabelText("products.dialType") as HTMLSelectElement;
    fireEvent.click(within(dialSelect.parentElement!).getByRole("button", { name: "products.referenceAdd" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("products.referenceNameRu"), { target: { value: " Дубликат " } });
    const form = within(dialog).getByLabelText("products.referenceNameRu").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mocks.createReference).toHaveBeenCalledTimes(1);
    rejectRequest?.(new (await import("@/shared/api/client")).CrmApiError(409, "duplicate", "REFERENCE_DUPLICATE"));
    expect(await within(dialog).findByText("products.referenceDuplicate")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("keeps an oversized preview inside a dedicated scroll body with actions outside it", async () => {
    const oversizedPreview: KaspiImportPreview = {
      ...preview,
      sourceUrl: `https://kaspi.kz/shop/p/${"very-long-product-segment-".repeat(20)}`,
      mappedCharacteristics: Array.from({ length: 36 }, (_, index) => ({
        sourceLabel: `Long mapped characteristic ${index + 1}`,
        sourceValue: `Long source value ${index + 1} ${"unbroken".repeat(12)}`,
        targetField: "watchDetails.waterResistance",
        resolvedValue: `Resolved ${index + 1}`,
        resolution: "ALIAS" as const,
      })),
      unmappedCharacteristics: Array.from({ length: 8 }, (_, index) => ({
        sourceLabel: `Unsupported ${index + 1}`,
        sourceValue: `${"long-unmatched-value-".repeat(12)}${index + 1}`,
        reason: "UNSUPPORTED_FOR_CATEGORY" as const,
      })),
    };
    mocks.importKaspiProduct.mockResolvedValue(oversizedPreview);
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));

    const dialog = await screen.findByRole("dialog", { name: "products.kaspiImportTitle" });
    const scrollBody = within(dialog).getByLabelText("products.kaspiImportPreview");
    const applyButton = within(dialog).getByRole("button", { name: "products.kaspiImportApply" });
    const actions = applyButton.parentElement;

    expect(scrollBody.classList.contains("crm-kaspi-dialog__body")).toBe(true);
    expect(scrollBody.getAttribute("tabindex")).toBe("0");
    expect(scrollBody.contains(actions)).toBe(false);
    expect(actions?.classList.contains("crm-confirm-dialog__actions")).toBe(true);
    expect(within(scrollBody).getByText("Long mapped characteristic 36:")).toBeTruthy();
    expect(within(scrollBody).getByText("Unsupported 8:")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(scrollBody));
  });

  it("keeps untrusted Kaspi description content as text until the sanitized Markdown renderer", async () => {
    const untrusted = [
      '<script>alert("script")</script>',
      '<img src=x onerror="alert(1)">',
      '<u onclick="alert(2)">Safe underline</u>',
      '[Unsafe](javascript:alert(3))',
      '&lt;script&gt;encoded&lt;/script&gt;',
    ].join("\n");
    mocks.importKaspiProduct.mockResolvedValue({
      ...preview,
      values: { ...preview.values, descriptionRu: untrusted },
      mappedFields: [
        ...preview.mappedFields,
        { targetField: "descriptionRu", resolvedValue: untrusted },
      ],
    });
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));

    const dialog = await screen.findByRole("dialog", { name: "products.kaspiImportTitle" });
    expect(dialog.textContent).toContain(untrusted);
    expect(dialog.querySelector("script, img, [onerror], [onclick]")).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "products.kaspiImportApply" }));
    expect((document.getElementById("descriptionRu") as HTMLTextAreaElement).value).toBe(untrusted);
  });

  it("resets a stale inline collection draft when import changes the selected brand", async () => {
    const changedBrandPreview: KaspiImportPreview = {
      ...preview,
      values: { ...preview.values, brandId: 11 },
      mappedFields: [...preview.mappedFields, { targetField: "brandId", resolvedValue: "Casio" }],
    };
    mocks.importKaspiProduct.mockResolvedValue(changedBrandPreview);
    render(<ProductForm />);

    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    fireEvent.change(screen.getByLabelText("products.brand"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "products.collectionCreateOpen" }));
    fireEvent.change(screen.getByLabelText("products.collectionNameRu"), { target: { value: "Stale collection" } });

    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImport" }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    fireEvent.click(await screen.findByRole("button", { name: "products.kaspiImportApply" }));

    expect((screen.getByLabelText("products.brand") as HTMLSelectElement).value).toBe("11");
    expect(screen.queryByLabelText("products.collectionNameRu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "products.collectionCreateOpen" }));
    expect((screen.getByLabelText("products.collectionBrand") as HTMLSelectElement).value).toBe("11");
    expect((screen.getByLabelText("products.collectionNameRu") as HTMLInputElement).value).toBe("");
  });

  it("traps focus, locks background scroll, and restores both after Escape and the close button", async () => {
    render(<ProductForm />);
    fireEvent.change(await screen.findByLabelText("products.category"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "products.categoryFirstSubmit" }));
    const trigger = screen.getByRole("button", { name: "products.kaspiImport" });
    trigger.focus();
    fireEvent.click(trigger);

    let dialog = screen.getByRole("dialog", { name: "products.kaspiImportTitle" });
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.change(within(dialog).getByLabelText("products.kaspiImportUrl"), {
      target: { value: preview.sourceUrl },
    });
    const buttons = within(dialog).getAllByRole("button");
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    dialog = screen.getByRole("dialog", { name: "products.kaspiImportTitle" });
    fireEvent.click(within(dialog).getAllByRole("button", { name: "common.cancel" })[0]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });
});
