package com.shop.vympel.dtos.crm;

import jakarta.validation.constraints.Size;

public record ProductMarketplaceLinksRequest(
        @Size(max = 2048)
        String kaspiUrl,

        @Size(max = 2048)
        String wildberriesUrl
) {
}
