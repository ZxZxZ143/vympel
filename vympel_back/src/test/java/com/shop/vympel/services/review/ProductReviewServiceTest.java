package com.shop.vympel.services.review;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.entity.review.ProductReview;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.review.ProductReviewRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.review.ProductReviewCreateRequest;
import com.shop.vympel.enums.ProductReviewAuthorType;
import com.shop.vympel.enums.ProductReviewStatus;
import com.shop.vympel.services.productName.ProductNameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductReviewServiceTest {
    @Mock
    private ProductReviewRepository productReviewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductNameService productNameService;

    private ProductReviewService service;

    @BeforeEach
    void setUp() {
        service = new ProductReviewService(
                productReviewRepository,
                productRepository,
                userRepository,
                productNameService
        );
    }

    @Test
    void guestReviewIsTrimmedAndCreatedPending() {
        Product product = new Product();
        product.setId(42L);
        when(productRepository.findById(42L)).thenReturn(Optional.of(product));
        when(productReviewRepository.save(any(ProductReview.class))).thenAnswer(invocation -> {
            ProductReview review = invocation.getArgument(0);
            review.setId(7L);
            return review;
        });

        var response = service.create(
                42L,
                new ProductReviewCreateRequest(5, "  Отличный товар  "),
                null
        );

        ArgumentCaptor<ProductReview> captor = ArgumentCaptor.forClass(ProductReview.class);
        verify(productReviewRepository).save(captor.capture());
        ProductReview saved = captor.getValue();

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(saved.getAuthorType()).isEqualTo(ProductReviewAuthorType.GUEST);
        assertThat(saved.getUser()).isNull();
        assertThat(saved.getText()).isEqualTo("Отличный товар");
        assertThat(saved.getStatus()).isEqualTo(ProductReviewStatus.PENDING);
    }

    @Test
    void publicListRequestsApprovedReviewsOnly() {
        Product product = new Product();
        product.setId(42L);
        when(productRepository.existsById(42L)).thenReturn(true);
        when(productReviewRepository.findAll(
                any(Specification.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<ProductReview>(List.of()));

        assertThat(service.getApproved(42L)).isEmpty();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productReviewRepository).findAll(any(Specification.class), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(15);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("createdAt").getDirection())
                .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void publicListMapsFilterSortAndPagination() {
        Product product = new Product();
        product.setId(42L);
        when(productRepository.existsById(42L)).thenReturn(true);
        when(productReviewRepository.findAll(
                any(Specification.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<ProductReview>(List.of(), PageRequest.of(1, 15), 0));

        service.getApproved(
                42L,
                5,
                true,
                "lowestRating",
                PageRequest.of(1, 15)
        );

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productReviewRepository).findAll(any(Specification.class), pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(15);
        assertThat(pageable.getSort().getOrderFor("rating").getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(pageable.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void publicListRejectsUnsupportedReviewSort() {
        when(productRepository.existsById(42L)).thenReturn(true);

        assertThatThrownBy(() -> service.getApproved(
                42L,
                null,
                null,
                "dropTable",
                PageRequest.of(0, 15)
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported review sort");
    }

    @Test
    void publicListRejectsInvalidRatingFilter() {
        when(productRepository.existsById(42L)).thenReturn(true);

        assertThatThrownBy(() -> service.getApproved(
                42L,
                6,
                null,
                "newest",
                PageRequest.of(0, 15)
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Rating must be between 1 and 5");
    }

    @Test
    void productsWithoutApprovedReviewsReceiveEmptyRatingSummary() {
        ProductShortResponse product = new ProductShortResponse(
                42L,
                "Product",
                "Model",
                100,
                1,
                "ACTIVE",
                null,
                null,
                null,
                null,
                null,
                null
        );
        when(productReviewRepository.findRatingSummaries(
                eq(List.of(42L)),
                eq(ProductReviewStatus.APPROVED)
        )).thenReturn(List.of());

        service.applyRatingSummaries(List.of(product));

        assertThat(product.getRatingAverage()).isNull();
        assertThat(product.getRatingCount()).isZero();
    }
}
