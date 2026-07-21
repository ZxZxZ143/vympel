package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.db.repositories.product.features.*;
import com.shop.vympel.db.repositories.product.watchDetail.WatchMechanismRepository;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.details.WatchDetailCreateRequest;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SKUService {

    private final BrandRepository brandRepository;
    private final CollectionRepository collectionRepository;
    private final CategoryRepository categoryRepository;

    private final GenderRepository genderRepository;
    private final WatchMechanismRepository watchMechanismRepository;
    private final StoneInlayRepository stoneInlayRepository;
    private final GlassTypeRepository glassTypeRepository;
    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public String skuGen(ProductCreateRequest product) {
        if (product == null) throw new IllegalArgumentException("product is null");

        String brandPart = brandRepository.findById(product.getBrandId())
                .map(b -> safePart(b.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found: " + product.getBrandId()));

        String collectionPart = product.getCollectionId() == null
                ? "NC"
                : collectionRepository.findById(product.getCollectionId())
                .map(c -> safePart(firstNonBlank(c.getCode(), c.getName())))
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + product.getCollectionId()));

        String categoryPart = product.getCategoryId() == null
                ? "NCAT"
                : categoryRepository.findById(product.getCategoryId())
                .map(c -> safePart(firstNonBlank(c.getCode(), c.getCode())))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + product.getCategoryId()));

        WatchDetailCreateRequest w = product.getWatchDetails();
        if (!hasCompleteSkuDetails(w)) {
            String modelPart = safePart(product.getModel());
            String typePart = safePart(product.getProductType());
            String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            return String.join("-",
                    "SKU",
                    brandPart,
                    collectionPart,
                    modelPart,
                    categoryPart,
                    typePart,
                    suffix
            );
        }

        String genderPart = genderRepository.findById(w.getGenderId())
                .map(g -> safePart(g.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Gender not found: " + w.getGenderId()));

        String mechanismPart = watchMechanismRepository.findById(w.getMechanismId())
                .map(m -> safePart(m.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Mechanism not found: " + w.getMechanismId()));

        String stonePart = (w.getStoneInlayId() == null)
                ? "NST"
                : stoneInlayRepository.findById(w.getStoneInlayId())
                .map(s -> safePart(s.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Stone inlay not found: " + w.getStoneInlayId()));

        String glassPart = glassTypeRepository.findById(w.getGlassTypeId())
                .map(g -> safePart(g.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Glass type not found: " + w.getGlassTypeId()));

        String caseMatPart = materialRepository.findById(w.getCaseMaterialId())
                .map(m -> safePart(m.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Case material not found: " + w.getCaseMaterialId()));

        String strapMatPart = materialRepository.findById(w.getStrapMaterialId())
                .map(m -> safePart(m.getCode()))
                .orElseThrow(() -> new ResourceNotFoundException("Strap material not found: " + w.getStrapMaterialId()));

        String sizePart = formatCaseSize(w.getCaseSizeMm());
        String wrPart = formatWaterResistance(w.getWaterResistance());

        return String.join("-",
                "SKU",
                brandPart,
                collectionPart,
                product.getModel().replaceAll(" ", "-").toUpperCase(),
                categoryPart,
                genderPart,
                mechanismPart,
                stonePart,
                glassPart,
                caseMatPart,
                strapMatPart,
                sizePart,
                wrPart
        );
    }

    private static String safePart(String raw) {
        if (raw == null || raw.isBlank()) return "NA";
        return raw.trim()
                .toUpperCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^A-Z0-9\\-]", "");
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }

    private static String formatCaseSize(Integer sizeMm) {
        if (sizeMm == null) return "NSZ";
        BigDecimal b = new BigDecimal(sizeMm);
        BigDecimal scaled = b.multiply(BigDecimal.TEN);
        return "SZ" + scaled.stripTrailingZeros().toPlainString().replace(".", "");
    }

    private static String formatWaterResistance(String wr) {
        if (wr == null || wr.isBlank()) return "NWR";
        return safePart(wr);
    }

    private static boolean hasCompleteSkuDetails(WatchDetailCreateRequest details) {
        return details != null
                && details.getGenderId() != null
                && details.getMechanismId() != null
                && details.getGlassTypeId() != null
                && details.getCaseMaterialId() != null
                && details.getStrapMaterialId() != null
                && details.getCaseSizeMm() != null;
    }
}

