import {describe,expect,it} from "vitest";
import {findCatalogHeroBlock,catalogHeroFallback} from "./catalogCategories";
import type {ICmsBlock,CategoryBanner} from "@/api/types/CmsTypes";
const block=(key:string)=>({blockKey:key} as ICmsBlock);
const resolution=(effectiveBlockKey:string|null):CategoryBanner=>({categoryCode:"CHILD",parentCode:"ROOT",names:{en:"Child"},explicitBlockKey:null,effectiveBlockKey,sourceCategoryCode:"ROOT",mode:"INHERITED",hasChildren:false});
describe("catalog banner metadata",()=>{
 it("uses the backend's real-tree inherited source",()=>{
  const parent=block("catalog.category.ROOT.heroBanner");
  expect(findCatalogHeroBlock([parent,block("catalog.heroBanner")],"child",[resolution(parent.blockKey)])).toBe(parent);
 });
 it("does not guess an unpublished override or parent when resolution is empty",()=>{
  expect(findCatalogHeroBlock([block("catalog.category.CHILD.heroBanner")],"CHILD",[resolution(null)])).toBeNull();
 });
 it("retains accessory/interior static artwork when CMS has no effective block",()=>{
  expect(catalogHeroFallback("ACCESSORY")).toContain("accessories");
  expect(catalogHeroFallback("WATCH_WALL")).toContain("interior");
 });
});
