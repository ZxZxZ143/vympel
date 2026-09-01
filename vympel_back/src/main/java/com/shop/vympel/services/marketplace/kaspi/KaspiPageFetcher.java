package com.shop.vympel.services.marketplace.kaspi;

public interface KaspiPageFetcher {
    FetchedPage fetch(String sourceUrl);

    record FetchedPage(String finalUrl, String html) {
    }
}
