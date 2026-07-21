import { describe, expect, it } from "vitest";
import { locales, messages } from "@/shared/i18n/messages";

describe("CRM authentication messages", () => {
  it.each(locales)("defines session and authorization messages for %s", (locale) => {
    expect(messages[locale].common.sessionExpired).toBeTruthy();
    expect(messages[locale].common.forbiddenAction).toBeTruthy();
    expect(messages[locale].login.logoutFailed).toBeTruthy();
    expect(messages[locale].login.restoreFailed).toBeTruthy();
  });
});
