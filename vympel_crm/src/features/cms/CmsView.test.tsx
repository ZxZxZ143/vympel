// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor,within} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {messages} from "@/shared/i18n/messages";
import {CmsView} from "./CmsView";
const mocks=vi.hoisted(()=>({cmsPages:vi.fn(),cmsPage:vi.fn(),deleteCmsBlock:vi.fn(),updateCmsBlock:vi.fn(),createCmsBlock:vi.fn(),success:vi.fn(),error:vi.fn(),warning:vi.fn(),t:(key:string)=>key}));
vi.mock("@/shared/api/client",()=>({crmApi:mocks}));
vi.mock("@/shared/i18n/useI18n",()=>({useI18n:()=>({locale:"ru",t:mocks.t,messages:messages.ru})}));
vi.mock("@/shared/feedback/NotificationProvider",()=>({useNotifications:()=>mocks}));
const parent={id:10,pageKey:"catalog",blockKey:"catalog.category.PARENT.heroBanner",blockType:"BANNER",sortOrder:10,status:"PUBLISHED",media:{id:1,url:"/parent.jpg"},linkType:"NONE",linkOpenBehavior:"SAME_TAB",translations:{}};
const child={...parent,id:11,blockKey:"catalog.category.CHILD.heroBanner",sortOrder:20,media:{id:2,url:"/child.jpg"}};
const names=(name:string)=>({ru:name,kz:name,en:name});
const basePage={pageKey:"catalog",title:"Catalog",status:"ACTIVE",blocks:[parent],categoryBanners:[{categoryCode:"PARENT",names:names("Parent"),mode:"OWN",explicitBlockKey:parent.blockKey,effectiveBlockKey:parent.blockKey,sourceCategoryCode:"PARENT",hasChildren:true},{categoryCode:"CHILD",parentCode:"PARENT",names:names("Child"),mode:"INHERITED",explicitBlockKey:null,effectiveBlockKey:parent.blockKey,sourceCategoryCode:"PARENT",hasChildren:false}]};
afterEach(()=>{cleanup();vi.clearAllMocks();});
beforeEach(()=>{mocks.cmsPages.mockResolvedValue([{pageKey:"catalog",title:"Catalog",status:"ACTIVE",blockCount:1}]);mocks.cmsPage.mockResolvedValue(basePage);mocks.deleteCmsBlock.mockResolvedValue(child);});
async function select(code:string){render(<CmsView/>);const select=await screen.findByLabelText("catalogTools.category");fireEvent.change(select,{target:{value:code}});}
describe("category banner management",()=>{
 it.each([["CHILD","catalog-hero-banner.webp"],["ACCESSORIES","accessories_hero_banner.webp"],["WATCH_INTERIOR","interior_hero_banner.webp"]])("previews the static fallback for %s",async(code,asset)=>{mocks.cmsPage.mockResolvedValue({...basePage,blocks:[],categoryBanners:[{...basePage.categoryBanners[1],categoryCode:code,mode:"DEFAULT",effectiveBlockKey:null,sourceCategoryCode:null}]});await select(code);expect(screen.getByText("catalogTools.default")).toBeTruthy();expect(document.querySelector(`img[src="/${asset}"]`)).toBeTruthy();});
 it("shows the inherited source and prepares a child override without touching the parent",async()=>{await select("CHILD");expect(screen.getByText("catalogTools.inherited: Parent")).toBeTruthy();expect(document.querySelector('img[src="/parent.jpg"]')).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:"catalogTools.ownSet"}));await waitFor(()=>expect((screen.getByLabelText("cms.blockKey") as HTMLInputElement).value).toBe(child.blockKey));expect(mocks.updateCmsBlock).not.toHaveBeenCalled();expect(mocks.createCmsBlock).not.toHaveBeenCalled();});
 it("shows descendant impact for a parent",async()=>{await select("PARENT");expect(screen.getByText("catalogTools.own")).toBeTruthy();expect(screen.getByText("catalogTools.descendants")).toBeTruthy();});
 it("confirms removal of only the selected override and refreshes inherited metadata",async()=>{mocks.cmsPage.mockResolvedValueOnce({...basePage,blocks:[parent,child],categoryBanners:[basePage.categoryBanners[0],{...basePage.categoryBanners[1],mode:"OWN",explicitBlockKey:child.blockKey,effectiveBlockKey:child.blockKey,sourceCategoryCode:"CHILD"}]}).mockResolvedValue(basePage);await select("CHILD");fireEvent.click(screen.getByRole("button",{name:"catalogTools.reset"}));expect(mocks.deleteCmsBlock).not.toHaveBeenCalled();fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button",{name:"catalogTools.delete"}));await waitFor(()=>expect(mocks.deleteCmsBlock).toHaveBeenCalledWith(11));expect(await screen.findByText("catalogTools.inherited: Parent")).toBeTruthy();expect(mocks.updateCmsBlock).not.toHaveBeenCalled();});
});
