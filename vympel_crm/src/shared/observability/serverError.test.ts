import {describe, expect, it} from "vitest";

import {crmServerErrorRecord} from "./serverError";

describe("CRM server error logging", () => {
  it("does not include messages, headers, or credentials", () => {
    const encoded = JSON.stringify(crmServerErrorRecord(
      new Error("password=do-not-log"),
      {method: "POST", path: "/login\n"},
      {routerKind: "App Router", routePath: "/login", routeType: "action"},
    ));
    expect(encoded).toContain("frontend_server_request_error");
    expect(encoded).not.toContain("do-not-log");
    expect(encoded).not.toContain("headers");
  });
});
