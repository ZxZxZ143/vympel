import {describe, expect, it} from "vitest";

import {
    createProductSnapshotFromBatchSummary,
    markProductSnapshotUnavailable,
} from "./localProductStorage";

describe("batch product snapshot refresh", () => {
    it("maps localized batch fields into the durable cart and favorite snapshot", () => {
        const snapshot = createProductSnapshotFromBatchSummary({
            id: 28,
            name: "Localized watch",
            sku: "SKU-28",
            price: 120000,
            stockQuantity: 3,
            status: "ACTIVE",
            imageUrl: "https://images.test/28.jpg",
            collection: {id: "4", name: "Classic"},
            brand: {id: "5", name: "Vympel"},
            categoryCode: "WATCH_WRIST",
            categoryName: "Wristwatches",
            ratingAverage: 4.5,
            ratingCount: 9,
        });

        expect(snapshot).toMatchObject({
            id: 28,
            name: "Localized watch",
            categoryCode: "WATCH_WRIST",
            brandName: "Vympel",
            status: "ACTIVE",
        });
    });

    it("marks an explicitly missing product unavailable without erasing its identity", () => {
        const original = createProductSnapshotFromBatchSummary({id: 2, name: "Saved watch", price: 99});
        const unavailable = markProductSnapshotUnavailable(original);

        expect(unavailable).toMatchObject({id: 2, name: "Saved watch", price: 99, status: "UNAVAILABLE", stockQuantity: 0});
        expect(original.status).not.toBe("UNAVAILABLE");
    });
});
