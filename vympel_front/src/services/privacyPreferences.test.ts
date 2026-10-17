import {afterEach, describe, expect, it, vi} from "vitest";

function storage() {
    const values: Record<string,string> = {};
    return {getItem:(key:string)=>values[key]??null,setItem:(key:string,value:string)=>{values[key]=value;},removeItem:(key:string)=>{delete values[key];}};
}
afterEach(() => {vi.unstubAllGlobals();vi.resetModules();});
describe("truthful browser storage consent", () => {
    it("denies optional analytics by default, persists a choice, and allows withdrawal", async () => {
        const localStorage=storage();
        vi.stubGlobal("window",{localStorage,sessionStorage:storage(),dispatchEvent:vi.fn()});
        const prefs=await import("./privacyPreferences");
        expect(prefs.analyticsAllowed()).toBe(false);
        prefs.setPrivacyChoice("analytics");
        expect(localStorage.getItem(prefs.PRIVACY_KEY)).toBe("analytics");
        expect(prefs.analyticsAllowed()).toBe(true);
        localStorage.removeItem(prefs.PRIVACY_KEY);
        expect(prefs.analyticsAllowed()).toBe(false);
        prefs.setPrivacyChoice("essential");
        expect(prefs.analyticsAllowed()).toBe(false);
        vi.resetModules();
        const reloaded=await import("./privacyPreferences");
        expect(reloaded.privacyChoice()).toBe("essential");
    });
    it("does not write analytics identifiers or send events before permission", async () => {
        const track=vi.fn();
        vi.doMock("@/api/controllers/PublicController",()=>({PublicApiController:{trackProductEvent:track}}));
        const sessionStorage=storage();
        vi.stubGlobal("window",{localStorage:storage(),sessionStorage,dispatchEvent:vi.fn()});
        const {trackProductEvent}=await import("@/components/ProductAnalyticsTracker");
        const prefs=await import("./privacyPreferences");
        trackProductEvent(1,"VIEW");
        expect(track).not.toHaveBeenCalled();
        expect(sessionStorage.getItem("vympel_analytics_session_id")).toBeNull();
        prefs.setPrivacyChoice("analytics");
        trackProductEvent(1,"VIEW");
        expect(track).toHaveBeenCalledTimes(1);
    });
    it("fails closed during SSR and when storage is unavailable", async () => {
        const prefs=await import("./privacyPreferences");
        expect(prefs.analyticsAllowed()).toBe(false);
        vi.stubGlobal("window",{localStorage:{getItem:()=>{throw Error("blocked");},setItem:()=>{throw Error("blocked");}},sessionStorage:storage(),dispatchEvent:vi.fn()});
        expect(prefs.analyticsAllowed()).toBe(false);
        prefs.setPrivacyChoice("essential");
        expect(prefs.privacyChoice()).toBe("essential");
    });
});
