// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductListView } from "./ProductListView";

const mocks = vi.hoisted(() => ({
  products: vi.fn(),
  error: vi.fn(),
  updateDiscount: vi.fn(),
  deleteArchivedProduct: vi.fn(),
}));

vi.mock("@/shared/api/client", () => ({
  crmApi: {
    products: mocks.products,
    updateDiscount: mocks.updateDiscount,
    deleteArchivedProduct: mocks.deleteArchivedProduct,
    updatePrice: vi.fn(),
    updateStock: vi.fn(),
    archiveProduct: vi.fn(),
  },
}));

vi.mock("@/shared/feedback/NotificationProvider", () => ({
  useNotifications: () => ({ success: vi.fn(), error: mocks.error }),
}));

vi.mock("@/shared/i18n/useI18n", () => ({
  useI18n: () => ({
    locale: "ru",
    t: (key: string) => key,
    messages: { products: { statuses: { ACTIVE: "Active", DRAFT: "Draft", ARCHIVED: "Archived" } } },
  }),
}));

vi.mock("@/features/products/productListRefresh", () => ({
  subscribeToProductListChanges: () => () => undefined,
}));

const product = {
  id: 12,
  sku: "SKU-12",
  name: "Romanson Black",
  model: "TL4247HM",
  price: 119950,
  stockQuantity: 2,
  status: "ACTIVE" as const,
  kaspiUrl: null,
  wildberriesUrl: null,
  modelVariantGroup: {
    model: "TL4247HM",
    total: 3,
    truncated: false,
    variants: [
      { id: 12, name: "Black", model: "TL4247HM", status: "ACTIVE" as const, mainImage: null },
      { id: 13, name: "White", model: "TL4247HM", status: "DRAFT" as const, mainImage: null },
      { id: 14, name: "Brown", model: "TL4247HM", status: "ARCHIVED" as const, mainImage: null },
    ],
  },
};

const page = {
  content: [product],
  totalElements: 1,
  totalPages: 2,
  number: 0,
  size: 12,
  first: true,
  last: false,
  empty: false,
  numberOfElements: 1,
};

describe("ProductListView model groups", () => {
  beforeEach(() => {
    mocks.products.mockResolvedValue(page);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the full model family while keeping the current product row editable", async () => {
    render(<ProductListView/>);

    expect(await screen.findByText("Romanson Black")).toBeTruthy();
    expect(screen.queryByText("catalogTools.manage")).toBeNull();
    expect(screen.getByText("3 products.variantsCount")).toBeTruthy();
    expect(screen.getByRole("link", { name: "products.openVariant: White" }).getAttribute("href"))
      .toBe("/products/13");
    expect(screen.getAllByRole("link", { name: "common.edit" })[0].getAttribute("href"))
      .toBe("/products/12");
  });

  it("preserves product pagination, search and status-filter request semantics", async () => {
    render(<ProductListView/>);
    await screen.findByText("Romanson Black");

    fireEvent.change(screen.getByLabelText("common.search"), { target: { value: " TL4247HM " } });
    fireEvent.click(screen.getByRole("button", { name: "common.search" }));
    await waitFor(() => expect(mocks.products.mock.calls.some(([params]) => (
      params.search === "TL4247HM" && params.page === 0 && params.size === 12
    ))).toBe(true));

    fireEvent.change(screen.getByLabelText("products.status"), { target: { value: "ACTIVE" } });
    await waitFor(() => expect(mocks.products.mock.calls.some(([params]) => (
      params.status === "ACTIVE" && params.page === 0
    ))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "products.next" }));
    await waitFor(() => expect(mocks.products.mock.calls.some(([params]) => params.page === 1)).toBe(true));
  });
});


describe("quick discounts and archived deletion", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("sets and clears discounts without opening the product form", async () => {
    mocks.products.mockResolvedValue(page);
    mocks.updateDiscount.mockResolvedValue({...product,discountPercent:15,finalPrice:101958});
    render(<ProductListView/>);
    const input=await screen.findByLabelText("catalogTools.discount");
    fireEvent.change(input,{target:{value:"15"}});
    fireEvent.click(screen.getByRole("button",{name:"catalogTools.discountSave"}));
    await waitFor(()=>expect(mocks.updateDiscount).toHaveBeenCalledWith(12,15,"ru"));
  });
  it("does not send zero, fractions, negative or excessive discounts",async()=>{
    mocks.products.mockResolvedValue(page);
    render(<ProductListView/>);
    const input=await screen.findByLabelText("catalogTools.discount");
    for(const value of ["0","-1","100","1.5"]){
      fireEvent.change(input,{target:{value}});
      fireEvent.click(screen.getByRole("button",{name:"catalogTools.discountSave"}));
    }
    expect(mocks.updateDiscount).not.toHaveBeenCalled();
  });
  it("clears a saved discount with an explicit null",async()=>{
    mocks.products.mockResolvedValue({...page,content:[{...product,discountPercent:15,finalPrice:101958}]});
    mocks.updateDiscount.mockResolvedValue({...product,discountPercent:null,finalPrice:product.price});
    render(<ProductListView/>);
    fireEvent.click(await screen.findByRole("button",{name:"catalogTools.discountClear"}));
    await waitFor(()=>expect(mocks.updateDiscount).toHaveBeenCalledWith(12,null,"ru"));
  });
  it("requires confirmation and offers permanent deletion only for archived rows",async()=>{
    mocks.products.mockResolvedValue({...page,content:[{...product,status:"ARCHIVED"}]});
    mocks.deleteArchivedProduct.mockResolvedValue(undefined);
    render(<ProductListView/>);
    fireEvent.click(await screen.findByRole("button",{name:"catalogTools.delete"}));
    expect(mocks.deleteArchivedProduct).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"catalogTools.delete"}));
    await waitFor(()=>expect(mocks.deleteArchivedProduct).toHaveBeenCalledWith(12));
  });
  it("does not offer permanent deletion for active products",async()=>{
    mocks.products.mockResolvedValue(page);
    render(<ProductListView/>);
    await screen.findByText("Romanson Black");
    expect(screen.queryByRole("button",{name:"catalogTools.delete"})).toBeNull();
  });
});
