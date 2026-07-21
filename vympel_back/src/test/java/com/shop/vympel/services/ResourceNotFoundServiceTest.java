package com.shop.vympel.services;

import com.shop.vympel.db.repositories.CustomerRequestRepository;
import com.shop.vympel.db.repositories.category.CategoryRepository;
import com.shop.vympel.db.repositories.cms.CmsBlockRepository;
import com.shop.vympel.db.repositories.cms.CmsMediaRepository;
import com.shop.vympel.db.repositories.cms.CmsPageRepository;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.product.features.BrandRepository;
import com.shop.vympel.db.repositories.product.features.CollectionI18nRepository;
import com.shop.vympel.db.repositories.product.features.CollectionRepository;
import com.shop.vympel.db.repositories.review.ProductReviewRepository;
import com.shop.vympel.db.repositories.user.RoleRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.db.repositories.user.UserRoleRepository;
import com.shop.vympel.dtos.crm.CrmCollectionCreateRequest;
import com.shop.vympel.enums.Language;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.services.catalog.CatalogCategoryProfileService;
import com.shop.vympel.services.auth.CrmSessionService;
import com.shop.vympel.services.cms.CmsServiceImpl;
import com.shop.vympel.services.crm.CrmCollectionService;
import com.shop.vympel.services.crm.CrmUserManagementService;
import com.shop.vympel.services.objectStorage.ObjectStorageService;
import com.shop.vympel.services.productName.ProductNameService;
import com.shop.vympel.services.request.CustomerRequestService;
import com.shop.vympel.services.review.ProductReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResourceNotFoundServiceTest {

    @Test
    void missingCategoryBrandReviewAndRequestUseDomainNotFoundException() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        when(categoryRepository.getByCode("MISSING_CATEGORY")).thenReturn(Optional.empty());
        CatalogCategoryProfileService categories = new CatalogCategoryProfileService(categoryRepository);

        BrandRepository brandRepository = mock(BrandRepository.class);
        when(brandRepository.findById(44L)).thenReturn(Optional.empty());
        CrmCollectionService collections = new CrmCollectionService(
                brandRepository,
                mock(CollectionRepository.class),
                mock(CollectionI18nRepository.class)
        );

        ProductReviewRepository reviewRepository = mock(ProductReviewRepository.class);
        when(reviewRepository.findById(55L)).thenReturn(Optional.empty());
        ProductReviewService reviews = new ProductReviewService(
                reviewRepository,
                mock(ProductRepository.class),
                mock(UserRepository.class),
                mock(ProductNameService.class)
        );

        CustomerRequestRepository requestRepository = mock(CustomerRequestRepository.class);
        when(requestRepository.findById(66L)).thenReturn(Optional.empty());
        CustomerRequestService requests = new CustomerRequestService(
                requestRepository,
                mock(UserRepository.class),
                mock(com.shop.vympel.security.ratelimit.AbuseProtectionService.class)
        );

        assertAll(
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> categories.resolveContext("missing-category")),
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> collections.create(new CrmCollectionCreateRequest(44L, null), Language.RU)),
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> reviews.approve(55L, Language.RU, null)),
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> requests.getOne(66L))
        );
    }

    @Test
    void missingCrmUserAndCmsEntitiesUseDomainNotFoundException() {
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findById(77L)).thenReturn(Optional.empty());
        CrmUserManagementService users = new CrmUserManagementService(
                userRepository,
                mock(RoleRepository.class),
                mock(UserRoleRepository.class),
                mock(PasswordEncoder.class),
                mock(CrmSessionService.class)
        );

        CmsPageRepository pageRepository = mock(CmsPageRepository.class);
        CmsBlockRepository blockRepository = mock(CmsBlockRepository.class);
        when(pageRepository.findByPageKey("missing-page")).thenReturn(Optional.empty());
        when(blockRepository.findById(88L)).thenReturn(Optional.empty());
        CmsServiceImpl cms = new CmsServiceImpl(
                pageRepository,
                blockRepository,
                mock(CmsMediaRepository.class),
                mock(ObjectStorageService.class),
                mock(com.shop.vympel.services.cms.CmsRevalidationOutboxService.class),
                mock(org.springframework.context.ApplicationEventPublisher.class)
        );

        assertAll(
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> users.updateStatus(77L, true)),
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> cms.getCrmPage("missing-page")),
                () -> assertThrows(ResourceNotFoundException.class,
                        () -> cms.deleteBlock(88L))
        );
    }
}
