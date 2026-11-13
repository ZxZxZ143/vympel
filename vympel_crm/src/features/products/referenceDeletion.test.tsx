// @vitest-environment jsdom
import {useState} from "react";
import {act, cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {Feature, References, ReferenceCreateType} from "@/shared/api/types";
import {CreatableReferenceSelect, CreatableReferenceMultiSelect} from "./CreatableReferenceFields";
import {clearDeletedReference, removeReferenceFromCache, useReferenceDeletion, type ReferenceDeleteType} from "./referenceDeletion";

const mocks = vi.hoisted(() => ({remove: vi.fn(), removeCollection: vi.fn(), removeBrand: vi.fn(), success: vi.fn(), changed: vi.fn()}));
vi.mock("@/shared/api/client", () => ({crmApi: {deleteReference: mocks.remove, deleteCollection: mocks.removeCollection, deleteBrand: mocks.removeBrand}}));
vi.mock("@/shared/api/errors", () => ({getCrmErrorMessage: (error: {code: string}, fallback: string, _: unknown, codes: Record<string,string>) => codes[error.code] ?? fallback}));
vi.mock("@/shared/i18n/useI18n", () => ({useI18n: () => ({t: (key: string) => key === "catalogTools.referenceDeleteDescription" ? "Delete «{value}»?" : key})}));
vi.mock("@/shared/feedback/NotificationProvider", () => ({useNotifications: () => ({success: mocks.success})}));
const system: Feature = {id: 1, name: "Canonical", code: "STEEL", deletable: false};
const custom: Feature = {id: 2, name: "Custom <img src=x>", code: "CRM_1234567890ABCDEF", deletable: true};

function Harness({multi = false, type = "case-materials"}: {multi?: boolean; type?: ReferenceDeleteType}) {
  const [options, setOptions] = useState([system, custom]);
  const [value, setValue] = useState("1");
  const [values, setValues] = useState(["1"]);
  const deletion = useReferenceDeletion((_type,id) => {
    setOptions((current) => current.filter((option) => option.id !== id));
    if (value === String(id)) setValue("");
    setValues((current) => current.filter((item) => item !== String(id)));
  });
  return <><div>
    {multi ? <CreatableReferenceMultiSelect id="field" label="Field" value={values} options={options} onChange={(next) => {mocks.changed(next);setValues(next);}} deletion={deletion.actionsFor(type)}/>
      : <CreatableReferenceSelect id="field" label="Field" value={value} options={options} placeholder="Choose" onChange={(next) => {mocks.changed(next);setValue(next);}} deletion={deletion.actionsFor(type)}/>}
    <button type="button">Outside</button>
  </div>{deletion.dialog}</>;
}

beforeEach(() => {vi.clearAllMocks();mocks.remove.mockResolvedValue(undefined);mocks.removeCollection.mockResolvedValue(undefined);mocks.removeBrand.mockResolvedValue(undefined);});
afterEach(cleanup);
const open = () => fireEvent.click(screen.getByRole("button", {name: "Field"}));
const trash = () => screen.getByRole("button", {name: `catalogTools.deleteOption: ${custom.name}`});
const confirm = () => screen.getByRole("button", {name: "catalogTools.referenceDeleteConfirm"});

function waitForFocusAfterDeletion(trigger: HTMLElement) {
  return waitFor(() => {
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
}

describe("reference deletion in field options", () => {
  it("keeps canonical values protected, separates selection from deletion, and cancels without mutation", () => {
    render(<Harness/>);open();
    expect(screen.queryByRole("button",{name:"catalogTools.deleteOption: Canonical"})).toBeNull();
    expect(document.querySelector("img")).toBeNull();
    fireEvent.click(trash());
    expect(mocks.changed).not.toHaveBeenCalled();expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog").textContent).toContain(custom.name);
    fireEvent.click(within(screen.getByRole("alertdialog")).getAllByRole("button",{name:"common.cancel"}).at(-1)!);
    expect(mocks.remove).not.toHaveBeenCalled();expect(document.activeElement).toBe(screen.getByRole("button", {name: "Field"}));
    expect(trash()).toBeTruthy();
  });
  it("deletes only after confirmation, suppresses repeated submits, refreshes options and restores focus after the last custom option", async () => {
    let finish!: () => void;
    mocks.remove.mockReturnValue(new Promise<void>((resolve) => {finish = resolve;}));
    render(<Harness/>);
    const trigger = screen.getByRole("button", {name: "Field"});
    open();fireEvent.click(trash());const button=confirm();
    fireEvent.click(button);fireEvent.click(button);
    expect(mocks.remove).toHaveBeenCalledTimes(1);expect(mocks.remove).toHaveBeenCalledWith("case-materials",2);
    finish();
    await waitForFocusAfterDeletion(trigger);
    expect(screen.queryByText(custom.name)).toBeNull();
    expect(screen.getByRole("button", {name: "Field"}).textContent).toBe("Canonical");
  });
  it.each(["REFERENCE_IN_USE", "REFERENCE_PROTECTED"])("preserves options on %s with an accessible localized error", async (code) => {
    mocks.remove.mockRejectedValue({code});render(<Harness/>);open();fireEvent.click(trash());
    await act(async () => { fireEvent.click(confirm()); });
    const error = await screen.findByRole("alert");expect(error.textContent).toBe(code === "REFERENCE_IN_USE" ? "catalogTools.referenceInUse" : "catalogTools.referenceProtected");
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.matches("button:enabled")).toBe(true);
    expect(mocks.success).not.toHaveBeenCalled();
    fireEvent.keyDown(document,{key:"Escape"});expect(trash()).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", {name: "Field"}));
  });
  it("supports search, arrow navigation, Escape and selection without deleting", () => {
    render(<Harness/>);open();const search=screen.getByRole("searchbox");
    expect(document.activeElement).toBe(search);fireEvent.change(search,{target:{value:"custom"}});
    fireEvent.keyDown(search,{key:"ArrowDown"});expect(document.activeElement?.textContent).toBe("Choose");
    fireEvent.keyDown(document.activeElement!,{key:"ArrowDown"});expect(document.activeElement?.textContent).toBe(custom.name);
    fireEvent.click(document.activeElement!);expect(mocks.changed).toHaveBeenLastCalledWith("2");expect(mocks.remove).not.toHaveBeenCalled();
    open();fireEvent.keyDown(screen.getByRole("searchbox"),{key:"Escape"});expect(screen.queryByRole("dialog")).toBeNull();expect(document.activeElement?.id).toBe("field");
  });
  it("does not toggle multi-selection when its delete icon is clicked", async () => {
    render(<Harness multi type="watch-features"/>);
    const trigger = screen.getByRole("button", {name: "Field"});
    open();fireEvent.click(trash());
    expect(mocks.changed).not.toHaveBeenCalled();fireEvent.click(confirm());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("watch-features",2));
    await waitForFocusAfterDeletion(trigger);
    expect(screen.getByRole("button",{name:"Canonical"}).getAttribute("aria-pressed")).toBe("true");
  });
  it("uses the existing collection endpoint and retains in-use collections", async () => {
    mocks.removeCollection.mockRejectedValue({code:"COLLECTION_IN_USE"});render(<Harness type="collections"/>);open();fireEvent.click(trash());fireEvent.click(confirm());
    expect((await screen.findByRole("alert")).textContent).toBe("catalogTools.collectionInUse");
    expect(mocks.removeCollection).toHaveBeenCalledWith(2);expect(mocks.remove).not.toHaveBeenCalled();
  });
});

describe("shared form and reference-cache updates", () => {
  it("clears only matching fields in the same dictionary while preserving unrelated edits and numeric-ID collisions", () => {
    const form={nameRu:"Unsaved name",strapColorId:"2",dialColorId:"2",interiorColorId:"3",accessoryColorId:"2",caseMaterialId:"2",featureIds:["1","2"]};
    expect(clearDeletedReference(form,"colors",2)).toEqual({...form,strapColorId:"",dialColorId:"",accessoryColorId:""});
    expect(clearDeletedReference(form,"watch-features",2)).toEqual({...form,featureIds:["1"]});
    expect(clearDeletedReference(form,"colors",9)).toBe(form);
  });
  it("removes the shared material option for both case and strap selectors", () => {
    const refs={materials:[system,custom],genders:[custom]} as unknown as References;
    expect(removeReferenceFromCache(refs,"strap-materials",2)).toEqual({...refs,materials:[system]});
    expect(clearDeletedReference({caseMaterialId:"2",strapMaterialId:"2",genderId:"2"},"case-materials",2)).toEqual({caseMaterialId:"",strapMaterialId:"",genderId:"2"});
  });
});

const supportedTypes: Record<ReferenceCreateType, true> = {
  "watch-mechanisms": true, genders: true, "case-materials": true, "strap-materials": true,
  "glass-types": true, "stone-inlays": true, colors: true, "interior-styles": true,
  "interior-mechanisms": true, "interior-power-types": true, "watch-dial-types": true,
  "watch-dial-markings": true, "watch-power-sources": true, "watch-water-resistances": true, "watch-features": true,
};
it.each(Object.keys(supportedTypes) as ReferenceCreateType[])("confirms and sends the exact %s deletion type and ID", async (type) => {
  render(<Harness type={type} multi={type === "watch-features"}/>);open();fireEvent.click(trash());
  expect(mocks.remove).not.toHaveBeenCalled();
  fireEvent.click(confirm());
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(mocks.remove).toHaveBeenCalledWith(type,2);
  expect(screen.queryByRole("button", {name:custom.name})).toBeNull();
});
it("keeps all other multi-select choices after deleting a selected custom feature", async () => {
  render(<Harness multi type="watch-features"/>);open();
  fireEvent.click(screen.getByRole("button", {name:custom.name}));
  expect(mocks.changed).toHaveBeenLastCalledWith(["1","2"]);
  expect(screen.getByRole("button", {name:"Canonical"}).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", {name:custom.name}).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(trash());expect(mocks.changed).toHaveBeenCalledTimes(1);fireEvent.click(confirm());
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(screen.getByRole("button", {name:"Field"}).textContent).toBe("Canonical");
  expect(screen.getByRole("button", {name:"Canonical"}).getAttribute("aria-pressed")).toBe("true");
});
it("keeps the searchable picker for empty creatable dictionaries without inventing delete permission", () => {
  const add = vi.fn();
  render(<CreatableReferenceSelect id="field" label="Field" value="" options={[]} placeholder="Choose" onChange={vi.fn()} onAdd={add}/>);
  open();expect(screen.getByRole("searchbox")).toBeTruthy();expect(screen.getByRole("status").textContent).toBe("products.referenceNoOptions");
  expect(screen.queryByRole("button", {name:/catalogTools.deleteOption/})).toBeNull();
  fireEvent.keyDown(screen.getByRole("searchbox"), {key:"Escape"});
  fireEvent.click(screen.getByRole("button", {name:"products.referenceAdd"}));expect(add).toHaveBeenCalledTimes(1);
});
it("uses a portal and supports Shift+Tab returning to the trigger without trapping focus", () => {
  render(<Harness/>);open();
  expect(screen.getByRole("dialog").parentElement).toBe(document.body);
  fireEvent.keyDown(screen.getByRole("searchbox"), {key:"Tab",shiftKey:true});
  expect(screen.queryByRole("dialog")).toBeNull();expect(document.activeElement?.id).toBe("field");
});

describe("brand deletion", () => {
  it("deletes a brand through the brand endpoint and shows the brand title", async () => {
    render(<Harness type="brands"/>);
    open();
    fireEvent.click(trash());
    expect(screen.getByRole("alertdialog").textContent).toContain("catalogTools.brandDeleteTitle");
    fireEvent.click(confirm());
    await waitFor(() => expect(mocks.removeBrand).toHaveBeenCalledWith(2));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.removeCollection).not.toHaveBeenCalled();
  });

  it("maps brand conflicts to localized messages and keeps the dialog open", async () => {
    mocks.removeBrand.mockRejectedValueOnce({code: "BRAND_IN_USE"});
    render(<Harness type="brands"/>);
    open();
    fireEvent.click(trash());
    fireEvent.click(confirm());
    expect(await screen.findByText("catalogTools.brandInUse")).toBeTruthy();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });

  it("drops the brand's collections from the cache and clears brand-scoped form fields", () => {
    const references = {
      brands: [{id: 5, name: "Orient", code: "orient", countryId: 9, countryCode: "china", countryName: "China", deletable: true}],
      collections: [{id: 11, name: "Star", brandId: 5}, {id: 12, name: "Other", brandId: 6}],
    } as unknown as References;
    const next = removeReferenceFromCache(references, "brands", 5);
    expect(next?.brands).toEqual([]);
    expect(next?.collections.map((option) => option.id)).toEqual([12]);

    expect(clearDeletedReference({brandId: "5", collectionId: "11", productionCountryId: "9", model: "A"}, "brands", 5))
      .toEqual({brandId: "", collectionId: "", productionCountryId: "", model: "A"});
    const untouched = {brandId: "6", collectionId: "12"};
    expect(clearDeletedReference(untouched, "brands", 5)).toBe(untouched);
  });
});
