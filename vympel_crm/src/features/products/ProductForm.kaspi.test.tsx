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
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/shared/api/client", () => ({
  CrmApiError: class CrmApiError extends Error {
    code?: string;
  },
  crmApi: {
    references: mocks.references,
    importKaspiProduct: mocks.importKaspiProduct,
    createProduct: mocks.createProduct,
  },
}));

vi.mock("@/shared/feedback/NotificationProvider", () => ({
  useNotifications: () => ({ success: mocks.success, error: mocks.error }),
}));

vi.mock("@/shared/i18n/useI18n", () => ({
  useI18n: () => ({
    locale: "ru",
    t: (key: string) => key,
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
  brands: [{ id: 10, code: "ROMANSON", name: "Romanson", countryId: 20, countryCode: "KR", countryName: "Korea" }],
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
  countries: [{ id: 20, code: "KR", name: "Korea" }],
  interiorColors: [],
  interiorStyles: [],
  interiorMechanisms: [],
  interiorPowerTypes: [],
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
      waterResistance: "5 ATM",
      stoneInlayId: null,
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

    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: "https://example.com/product" } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    expect((await screen.findByRole("alert")).textContent).toContain("products.kaspiImportInvalidUrl");

    mocks.importKaspiProduct.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve(preview), 25);
    }));
    fireEvent.change(screen.getByLabelText("products.kaspiImportUrl"), { target: { value: preview.sourceUrl } });
    fireEvent.click(screen.getByRole("button", { name: "products.kaspiImportAction" }));
    expect((screen.getByRole("button", { name: "products.kaspiImportLoading" }) as HTMLButtonElement).disabled).toBe(true);
    expect(await screen.findByText("products.kaspiImportMappedCharacteristics")).toBeTruthy();
    expect(screen.getByText("Материал ремешка:")).toBeTruthy();
    expect(screen.getByText("Цвет корпуса:")).toBeTruthy();
    expect(screen.getByText("Материал корпуса:")).toBeTruthy();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "common.cancel" })[1]);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((screen.getByLabelText("products.nameRu") as HTMLInputElement).value).toBe("Before import");
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
      },
    });
  });
});
