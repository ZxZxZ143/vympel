import {describe, expect, it} from "vitest";

import {serverErrorRecord} from "./serverObservability";

describe("storefront server error logging", () => {
    it("emits bounded structured fields without exception messages or request headers", () => {
        const record = serverErrorRecord(
            new Error("secret-bearing message"),
            {method: "GET", path: "/ru\nproduct"},
            {routerKind: "App Router", routePath: "/[locale]/product/[id]", routeType: "render"},
        );
        const encoded = JSON.stringify(record);
        expect(record.event).toBe("frontend_server_request_error");
        expect(record.path).toBe("/ru_product");
        expect(encoded).not.toContain("secret-bearing message");
        expect(encoded).not.toContain("headers");
    });
});
