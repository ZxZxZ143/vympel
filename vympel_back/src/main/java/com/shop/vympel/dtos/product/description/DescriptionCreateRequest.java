package com.shop.vympel.dtos.product.description;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DescriptionCreateRequest {
    @Size(max = 10000)
    private String desc;

    @JsonProperty("desc_ru")
    @Size(max = 10000)
    private String descRu;

    @JsonProperty("desc_en")
    @Size(max = 10000)
    private String descEn;

    @JsonProperty("desc_kz")
    @Size(max = 10000)
    private String descKz;

    public DescriptionCreateRequest(String desc) {
        this.desc = desc;
    }
}
