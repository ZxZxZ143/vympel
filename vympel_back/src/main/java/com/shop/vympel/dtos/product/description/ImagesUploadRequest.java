package com.shop.vympel.dtos.product.description;

import com.shop.vympel.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImagesUploadRequest {
    private Long productId;
    private MediaType mediaType;
}
