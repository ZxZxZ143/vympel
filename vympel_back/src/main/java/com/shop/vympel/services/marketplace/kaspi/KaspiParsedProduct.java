package com.shop.vympel.services.marketplace.kaspi;

import java.util.List;

public record KaspiParsedProduct(
        String name,
        String brand,
        String model,
        Integer price,
        String description,
        List<KaspiCharacteristic> characteristics,
        List<String> warnings
) {
}
