package com.shop.vympel.services.product;

import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.dtos.product.ProductCreateRequest;
import com.shop.vympel.dtos.product.description.DescriptionCreateRequest;
import com.shop.vympel.dtos.product.description.ProductNameCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.BusinessRuleViolationException;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.mappers.product.EntityReferenceMapper;
import com.shop.vympel.mappers.product.ProductMapper;
import com.shop.vympel.services.categoryProduct.CategoryProductService;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.catalog.CatalogCategoryProfile;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.productDescription.ProductDescriptionService;
import com.shop.vympel.services.productName.ProductNameService;
import com.shop.vympel.services.review.ProductReviewService;
import com.shop.vympel.services.watchDetail.InteriorClockDetailServiceImpl;
import com.shop.vympel.services.watchDetail.WatchDetailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductMapper productMapper;
    @Mock
    private EntityReferenceMapper entityReferenceMapper;
    @Mock
    private SKUService skuService;
    @Mock
    private WatchDetailServiceImpl watchDetailService;
    @Mock
    private InteriorClockDetailServiceImpl interiorClockDetailService;
    @Mock
    private CatalogCategoryProfileService catalogCategoryProfileService;
    @Mock
    private ProductDescriptionService productDescriptionService;
    @Mock
    private ProductNameService productNameService;
    @Mock
    private CategoryProductService categoryProductService;
    @Mock
    private ObjectStorageService objectStorageService;
    @Mock
    private ProductReviewService productReviewService;

    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productService = new ProductServiceImpl(
                productRepository,
                productMapper,
                entityReferenceMapper,
                skuService,
                watchDetailService,
                interiorClockDetailService,
                catalogCategoryProfileService,
                productDescriptionService,
                productNameService,
                categoryProductService,
                objectStorageService,
                productReviewService
        );
    }

    @Test
    void crmSearchUsesFindAllWhenSearchIsNull() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<com.shop.vympel.db.entity.product.Product> page = new PageImpl<>(List.of(), pageable, 0);
        when(productRepository.findAll(pageable)).thenReturn(page);

        productService.getAllForCrm(pageable, Language.RU, null, null);

        verify(productRepository).findAll(pageable);
        verify(productRepository, never()).searchForCrm(any(), eq(pageable));
    }

    @Test
    void missingProductUsesDomainNotFoundException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> productService.get(999L, Language.RU)
        );
    }

    @Test
    void crmSearchUsesFindAllWhenSearchIsBlank() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<com.shop.vympel.db.entity.product.Product> page = new PageImpl<>(List.of(), pageable, 0);
        when(productRepository.findAll(pageable)).thenReturn(page);

        productService.getAllForCrm(pageable, Language.RU, "   ", null);

        verify(productRepository).findAll(pageable);
        verify(productRepository, never()).searchForCrm(any(), eq(pageable));
    }

    @Test
    void crmSearchUsesTypeSafeSearchQueryWhenSearchHasText() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<com.shop.vympel.db.entity.product.Product> page = new PageImpl<>(List.of(), pageable, 0);
        when(productRepository.searchForCrm("TM0", pageable)).thenReturn(page);

        productService.getAllForCrm(pageable, Language.RU, "  TM0  ", null);

        verify(productRepository).searchForCrm("TM0", pageable);
        verify(productRepository, never()).findAll(pageable);
    }

    @Test
    void crmSearchUsesStatusFilterWithoutHidingDraftsFromUnfilteredList() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(List.of(), pageable, 0);
        when(productRepository.findAllByStatusIgnoreCase("DRAFT", pageable)).thenReturn(page);

        productService.getAllForCrm(pageable, Language.RU, null, " draft ");

        verify(productRepository).findAllByStatusIgnoreCase("DRAFT", pageable);
        verify(productRepository, never()).findAll(pageable);
    }

    @Test
    void crmSearchCombinesTextAndStatusFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(List.of(), pageable, 0);
        when(productRepository.searchForCrmByStatus("APELLA", "ACTIVE", pageable)).thenReturn(page);

        productService.getAllForCrm(pageable, Language.RU, " APELLA ", "active");

        verify(productRepository).searchForCrmByStatus("APELLA", "ACTIVE", pageable);
    }

    @Test
    void minimalDraftCreationFallsBackTranslationsAndDoesNotRequireDescriptionsOrDetails() {
        ProductCreateRequest request = new ProductCreateRequest();
        ProductNameCreateRequest names = new ProductNameCreateRequest();
        names.setName_ru("Тестовые часы");
        request.setProductName(names);
        request.setModel("model-1");
        request.setPrice(100);
        request.setStockQuantity(0);
        request.setStatus("DRAFT");
        request.setProductType("WATCH");
        request.setBrandId(1L);
        request.setCategoryId(2L);

        Product product = new Product();
        product.setId(42L);
        when(catalogCategoryProfileService.profileForCategoryId(2L)).thenReturn(CatalogCategoryProfile.GENERIC);
        when(skuService.skuGen(request)).thenReturn("SKU-TEST");
        when(productRepository.findProductBySku("SKU-TEST")).thenReturn(Optional.empty());
        when(productMapper.toEntity(request, entityReferenceMapper)).thenReturn(product);
        when(productRepository.save(product)).thenReturn(product);

        Long id = productService.create(request);

        assertEquals(42L, id);
        verify(watchDetailService, never()).create(any(), any());
        verify(interiorClockDetailService, never()).create(any(), any());
        verify(productNameService).createProductName(product, Language.RU, "Тестовые часы");
        verify(productNameService).createProductName(product, Language.EN, "Тестовые часы");
        verify(productNameService).createProductName(product, Language.KZ, "Тестовые часы");

        ArgumentCaptor<DescriptionCreateRequest> descriptions = ArgumentCaptor.forClass(DescriptionCreateRequest.class);
        verify(productDescriptionService, times(3)).addProductDescription(eq(product), any(Language.class), descriptions.capture());
        descriptions.getAllValues().forEach(description -> assertEquals("", description.getDesc()));
    }

    @Test
    void activationIsRejectedWhenTheProductHasNoCanonicalMainImage() {
        Product product = new Product();
        product.setId(42L);
        product.setStatus("DRAFT");
        when(productRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(product));
        when(objectStorageService.hasRequiredMainProductImage(42L)).thenReturn(false);

        BusinessRuleViolationException exception = assertThrows(
                BusinessRuleViolationException.class,
                () -> productService.updateStatus(42L, "ACTIVE", Language.RU)
        );

        assertEquals("PRODUCT_MAIN_IMAGE_REQUIRED", exception.getCode());
        verify(productRepository, never()).save(product);
    }
}
