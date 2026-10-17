// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {Feature, Product, References} from "@/shared/api/types";
import {messages} from "@/shared/i18n/messages";
import {ProductForm} from "./ProductForm";
import {BulkProductCreateView} from "./BulkProductCreateView";

const mocks = vi.hoisted(() => ({references: vi.fn(), product: vi.fn(), remove: vi.fn(), create: vi.fn(), update: vi.fn(), bulk: vi.fn(), success: vi.fn(), push: vi.fn(), t: (key: string) => key === "catalogTools.referenceDeleteDescription" ? "Delete «{value}»?" : key}));
vi.mock("next/navigation", () => ({useRouter: () => ({push: mocks.push})}));
vi.mock("@/shared/api/client", () => ({crmApi: {references: mocks.references, product: mocks.product, deleteReference: mocks.remove, createProduct: mocks.create, updateProduct: mocks.update, createProductsBulk: mocks.bulk}}));
vi.mock("@/shared/feedback/NotificationProvider", () => ({useNotifications: () => ({success: mocks.success, error: vi.fn()})}));
vi.mock("@/shared/i18n/useI18n", () => ({useI18n: () => ({locale: "ru", t: mocks.t, messages: messages.ru})}));
const canonical: Feature = {id: 1, name: "Canonical", code: "CANONICAL", deletable: false};
const custom: Feature = {id: 90, name: "Custom value", code: "CRM_1234567890ABCDEF", deletable: true};
const categoryCodes = ["WATCH_WRIST", "WATCH_WALL", "WATCH_FLOOR", "ACCESSORIES", "APPLE_CASE"];
const refs: References = {
  categories: categoryCodes.map((code, index) => ({id:index + 1, name:code, code, parentId:null})),
  brands: [{id:1,name:"Romanson",code:"romanson",countryId:1,countryCode:"KR",countryName:"Korea"}],
  countries: [{id:1,name:"Korea",code:"KR"}], collections: [],
  mechanisms: [canonical], genders: [canonical], materials: [canonical], glassTypes: [canonical], stoneInlays: [canonical],
  interiorColors: [canonical], interiorStyles: [canonical], interiorMechanisms: [canonical], interiorPowerTypes: [canonical],
  watchDialTypes: [canonical], watchDialMarkings: [canonical], watchPowerSources: [canonical], watchWaterResistances: [canonical], watchFeatures: [canonical],
};
const watchFields = ["mechanismId", "genderId", "caseMaterialId", "strapMaterialId", "glassTypeId", "waterResistanceId", "stoneInlayId", "dialTypeId", "dialMarkingId", "powerSourceId", "strapColorId", "dialColorId", "featureIds"];
const interiorFields = ["interiorCaseMaterialId", "interiorColorId", "interiorStyleId", "interiorMechanismTypeId", "powerTypeId"];
const accessoryFields = ["accessoryCaseMaterialId", "accessoryInsertMaterialId", "accessoryColorId"];
const profiles = categoryCodes.map((code, index) => ({code, id:index + 1, fields:index === 0 ? watchFields : index < 3 ? interiorFields : accessoryFields}));
function product(categoryId = 1): Product {
  return {id:11,sku:"test",name:"Saved watch",model:"Test",price:100,stockQuantity:3,status:"DRAFT",productType:"WATCH",category:refs.categories[categoryId - 1],brand:refs.brands[0],collection:null,images:[],description:null,watchDetails:null};
}
beforeEach(() => {vi.clearAllMocks();mocks.references.mockResolvedValue(refs);mocks.product.mockResolvedValue(product());mocks.remove.mockResolvedValue(undefined);});
afterEach(cleanup);
async function start(mode: "create" | "edit" | "bulk", categoryId = 1) {
  mocks.product.mockResolvedValue(product(categoryId));
  render(mode === "bulk" ? <BulkProductCreateView/> : <ProductForm productId={mode === "edit" ? 11 : undefined}/>);
  if (mode !== "edit") {
    fireEvent.change(await screen.findByLabelText("products.category"), {target:{value:String(categoryId)}});
    fireEvent.click(screen.getByRole("button", {name:"products.categoryFirstSubmit"}));
  } else await screen.findByLabelText("products.nameRu");
}
function openId(id: string) {
  fireEvent.click(document.getElementById(id)!);
  return screen.getByRole("dialog");
}
function choose(id: string, optionId = 90) {
  const panel = openId(id);
  fireEvent.click(panel.querySelector(`[data-reference-choice="${optionId}"]`)!);
  if (screen.queryByRole("dialog")) fireEvent.keyDown(panel, {key:"Escape"});
}

for (const mode of ["create", "edit", "bulk"] as const) describe(`${mode} reference fields`, () => {
  it.each(profiles)("uses the shared searchable picker for every $code characteristic even with only protected values", async ({id,fields}) => {
    await start(mode,id);
    const ids = mode === "bulk" ? fields.flatMap((field) => {
      const capital = field[0].toUpperCase()+field.slice(1);
      return [`bulk${capital}`, ...Array.from(document.querySelectorAll(`[id^="row${capital}-"]`)).map((node) => node.id)];
    }) : fields;
    expect(ids.length).toBeGreaterThanOrEqual(fields.length);
    for (const fieldId of ids) {
      const trigger = document.getElementById(fieldId)!;
      expect(trigger?.tagName, fieldId).toBe("BUTTON");
      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
      expect(within(trigger.closest(".crm-field")!).getByRole("button", {name:"products.referenceAdd"})).toBeTruthy();
      const panel = openId(fieldId);
      expect(within(panel).getByRole("searchbox")).toBeTruthy();
      expect(panel.parentElement).toBe(document.body);
      expect(within(panel).queryByRole("button", {name:/catalogTools.deleteOption/})).toBeNull();
      fireEvent.keyDown(panel, {key:"Escape"});
      expect(document.activeElement).toBe(trigger);
    }
    expect(document.getElementById(mode === "bulk" ? "bulkBrandId" : "brandId")?.tagName).toBe("SELECT");
    if (id === 2 || id === 3) {
      expect(document.getElementById(mode === "bulk" ? "bulkProductionCountryId" : "productionCountryId")?.tagName).toBe("SELECT");
    }
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});

it.each(["create", "edit", "bulk"] as const)("synchronizes a deleted color across %s selectors without clearing materials or manual fields", async (mode) => {
  mocks.references.mockResolvedValue({...refs,interiorColors:[canonical,custom],materials:[canonical,custom]});
  await start(mode);
  const singleIds = ["strapColorId", "dialColorId"];
  const colorIds = mode === "bulk" ? ["bulkStrapColorId", "bulkDialColorId", ...Array.from(document.querySelectorAll('[id^="rowStrapColorId-"], [id^="rowDialColorId-"]')).map((node) => node.id)] : singleIds;
  const materialId = mode === "bulk" ? "bulkCaseMaterialId" : "caseMaterialId";
  const manual = mode === "bulk" ? document.querySelector<HTMLInputElement>("tbody input")! : screen.getByLabelText<HTMLInputElement>("products.nameRu");
  fireEvent.change(manual, {target:{value:"Keep my unsaved edit"}});
  for (const id of [...colorIds,materialId]) choose(id);
  openId(colorIds[0]);
  fireEvent.click(screen.getByRole("button", {name:"catalogTools.deleteOption: Custom value"}));
  expect(mocks.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name:"catalogTools.referenceDeleteConfirm"}));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(mocks.remove).toHaveBeenCalledWith("colors",90);
  expect(manual.value).toBe("Keep my unsaved edit");
  for (const id of colorIds) expect(document.getElementById(id)?.textContent).not.toContain(custom.name);
  expect(document.getElementById(materialId)?.textContent).toBe(custom.name);
  // The modal DOM disappears before its effect restores the background and focus.
  const restoredPanel = await screen.findByRole("dialog");
  expect(document.activeElement).toBe(document.getElementById(colorIds[0]));
  fireEvent.keyDown(restoredPanel, {key:"Escape"});
  for (const id of colorIds) {
    const panel = openId(id);
    expect(within(panel).queryByRole("button", {name:custom.name})).toBeNull();
    fireEvent.keyDown(panel, {key:"Escape"});
  }
  expect(mocks.references).toHaveBeenCalledTimes(1);
  expect(mocks.create).not.toHaveBeenCalled();expect(mocks.update).not.toHaveBeenCalled();expect(mocks.bulk).not.toHaveBeenCalled();
});
