package com.shop.vympel.services.review;

import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.entity.i18n.ProductI18n;
import com.shop.vympel.db.entity.review.ProductReview;
import com.shop.vympel.db.repositories.product.ProductRepository;
import com.shop.vympel.db.repositories.review.ProductRatingProjection;
import com.shop.vympel.db.repositories.review.ProductReviewRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.dtos.product.ProductResponse;
import com.shop.vympel.dtos.product.ProductShortResponse;
import com.shop.vympel.dtos.review.CrmProductReviewResponse;
import com.shop.vympel.dtos.review.ProductReviewCreateRequest;
import com.shop.vympel.dtos.review.ProductReviewSubmissionResponse;
import com.shop.vympel.dtos.review.PublicProductReviewResponse;
import com.shop.vympel.enums.Language;
import com.shop.vympel.enums.ProductReviewAuthorType;
import com.shop.vympel.enums.ProductReviewStatus;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.services.productName.ProductNameService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository productReviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductNameService productNameService;

    @Transactional
    public ProductReviewSubmissionResponse create(
            Long productId,
            ProductReviewCreateRequest request,
            Authentication authentication
    ) {
        var product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User author = authenticatedUser(authentication);

        ProductReview review = new ProductReview();
        review.setProduct(product);
        review.setUser(author);
        review.setAuthorType(author == null ? ProductReviewAuthorType.GUEST : ProductReviewAuthorType.USER);
        review.setAuthorName(author == null ? null : safeDisplayName(author));
        review.setRating(request.rating());
        review.setText(normalizeText(request.text()));
        review.setStatus(ProductReviewStatus.PENDING);

        ProductReview saved = productReviewRepository.save(review);
        return new ProductReviewSubmissionResponse(saved.getId(), saved.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<PublicProductReviewResponse> getApproved(Long productId) {
        return getApproved(productId, null, null, "newest", PageRequest.of(0, 15))
                .getContent();
    }

    @Transactional(readOnly = true)
    public Page<PublicProductReviewResponse> getApproved(
            Long productId,
            Integer rating,
            Boolean hasText,
            String rawSort,
            Pageable pageable
    ) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found");
        }

        validateOptionalRating(rating);

        Pageable mappedPageable = PageRequest.of(
                Math.max(pageable.getPageNumber(), 0),
                pageable.getPageSize(),
                publicReviewSort(rawSort)
        );

        return productReviewRepository
                .findAll(publicReviewSpecification(productId, rating, hasText), mappedPageable)
                .map(this::toPublicResponse);
    }

    @Transactional(readOnly = true)
    public Page<CrmProductReviewResponse> getForCrm(
            String rawStatus,
            String rawProductSearch,
            Integer rating,
            Boolean hasText,
            LocalDate dateFrom,
            LocalDate dateTo,
            Language language,
            Pageable pageable
    ) {
        ProductReviewStatus status = parseOptionalStatus(rawStatus);
        String productSearch = normalizeSearch(rawProductSearch);
        validateOptionalRating(rating);

        Specification<ProductReview> specification = (root, query, cb) -> cb.conjunction();

        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (rating != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("rating"), rating));
        }
        if (hasText != null) {
            specification = specification.and(reviewTextSpecification(hasText));
        }
        if (productSearch != null) {
            specification = specification.and((root, query, cb) -> {
                var product = root.join("product");
                String pattern = "%" + productSearch.toLowerCase(Locale.ROOT) + "%";
                var localizedName = query.subquery(Long.class);
                var productI18n = localizedName.from(ProductI18n.class);
                localizedName.select(productI18n.get("product").get("id"));
                localizedName.where(
                        cb.equal(productI18n.get("product").get("id"), product.get("id")),
                        cb.like(cb.lower(productI18n.<String>get("name")), pattern)
                );
                return cb.or(
                        cb.like(cb.lower(product.<String>get("model")), pattern),
                        cb.like(cb.lower(product.<String>get("sku")), pattern),
                        cb.exists(localizedName)
                );
            });
        }
        if (dateFrom != null) {
            Instant from = dateFrom.atStartOfDay().toInstant(ZoneOffset.UTC);
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        }
        if (dateTo != null) {
            Instant until = dateTo.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            specification = specification.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), until));
        }

        return productReviewRepository.findAll(specification, pageable)
                .map(review -> toCrmResponse(review, language));
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return productReviewRepository.countByStatus(ProductReviewStatus.PENDING);
    }

    @Transactional
    public CrmProductReviewResponse approve(Long reviewId, Language language, Authentication authentication) {
        return moderate(reviewId, ProductReviewStatus.APPROVED, language, authentication);
    }

    @Transactional
    public CrmProductReviewResponse reject(Long reviewId, Language language, Authentication authentication) {
        return moderate(reviewId, ProductReviewStatus.REJECTED, language, authentication);
    }

    @Transactional
    public CrmProductReviewResponse delete(Long reviewId, Language language, Authentication authentication) {
        return moderate(reviewId, ProductReviewStatus.DELETED, language, authentication);
    }

    @Transactional(readOnly = true)
    public void applyRatingSummary(ProductResponse response) {
        if (response == null || response.getId() == null) {
            return;
        }

        Map<Long, ProductRatingProjection> summaries = ratingSummaries(List.of(response.getId()));
        ProductRatingProjection summary = summaries.get(response.getId());
        response.setRatingAverage(summary == null ? null : summary.getRatingAverage());
        response.setRatingCount(summary == null ? 0L : summary.getRatingCount());
    }

    @Transactional(readOnly = true)
    public void applyRatingSummaries(List<ProductShortResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return;
        }

        List<Long> productIds = responses.stream()
                .map(ProductShortResponse::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, ProductRatingProjection> summaries = ratingSummaries(productIds);

        responses.forEach(response -> {
            ProductRatingProjection summary = summaries.get(response.getId());
            response.setRatingAverage(summary == null ? null : summary.getRatingAverage());
            response.setRatingCount(summary == null ? 0L : summary.getRatingCount());
        });
    }

    private CrmProductReviewResponse moderate(
            Long reviewId,
            ProductReviewStatus targetStatus,
            Language language,
            Authentication authentication
    ) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (review.getStatus() == ProductReviewStatus.DELETED && targetStatus != ProductReviewStatus.DELETED) {
            throw new IllegalArgumentException("Deleted reviews cannot be moderated");
        }

        review.setStatus(targetStatus);
        review.setModeratedAt(Instant.now());
        review.setModeratedBy(authenticatedUser(authentication));

        return toCrmResponse(productReviewRepository.save(review), language);
    }

    private Map<Long, ProductRatingProjection> ratingSummaries(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return productReviewRepository.findRatingSummaries(productIds, ProductReviewStatus.APPROVED)
                .stream()
                .collect(Collectors.toMap(ProductRatingProjection::getProductId, Function.identity()));
    }

    private Specification<ProductReview> publicReviewSpecification(
            Long productId,
            Integer rating,
            Boolean hasText
    ) {
        Specification<ProductReview> specification = (root, query, cb) -> cb.and(
                cb.equal(root.get("product").get("id"), productId),
                cb.equal(root.get("status"), ProductReviewStatus.APPROVED)
        );

        if (rating != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("rating"), rating));
        }

        if (hasText != null) {
            specification = specification.and(reviewTextSpecification(hasText));
        }

        return specification;
    }

    private Specification<ProductReview> reviewTextSpecification(Boolean hasText) {
        return (root, query, cb) -> {
            var text = root.<String>get("text");

            if (Boolean.TRUE.equals(hasText)) {
                return cb.and(
                        cb.isNotNull(text),
                        cb.notEqual(cb.trim(text), "")
                );
            }

            return cb.or(
                    cb.isNull(text),
                    cb.equal(cb.trim(text), "")
            );
        };
    }

    private Sort publicReviewSort(String rawSort) {
        String sort = rawSort == null || rawSort.isBlank()
                ? "newest"
                : rawSort.trim();

        return switch (sort) {
            case "newest" -> Sort.by(
                    Sort.Order.desc("createdAt"),
                    Sort.Order.desc("id")
            );
            case "oldest" -> Sort.by(
                    Sort.Order.asc("createdAt"),
                    Sort.Order.asc("id")
            );
            case "highestRating", "positiveFirst" -> Sort.by(
                    Sort.Order.desc("rating"),
                    Sort.Order.desc("createdAt"),
                    Sort.Order.desc("id")
            );
            case "lowestRating", "negativeFirst" -> Sort.by(
                    Sort.Order.asc("rating"),
                    Sort.Order.desc("createdAt"),
                    Sort.Order.desc("id")
            );
            default -> throw new IllegalArgumentException("Unsupported review sort");
        };
    }

    private PublicProductReviewResponse toPublicResponse(ProductReview review) {
        return new PublicProductReviewResponse(
                review.getId(),
                review.getRating(),
                review.getText(),
                review.getAuthorType().name(),
                review.getAuthorName(),
                review.getCreatedAt()
        );
    }

    private CrmProductReviewResponse toCrmResponse(ProductReview review, Language language) {
        User moderator = review.getModeratedBy();
        return new CrmProductReviewResponse(
                review.getId(),
                review.getProduct().getId(),
                productNameService.getById(review.getProduct().getId(), language).getName(),
                review.getProduct().getModel(),
                review.getProduct().getSku(),
                review.getRating(),
                review.getText(),
                review.getAuthorType().name(),
                review.getAuthorName(),
                review.getCreatedAt(),
                review.getStatus().name(),
                review.getModeratedAt(),
                moderator == null ? null : firstNonBlank(safeDisplayName(moderator), moderator.getEmail())
        );
    }

    private User authenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        try {
            return userRepository.findById(Long.valueOf(authentication.getName())).orElse(null);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private ProductReviewStatus parseOptionalStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank() || "ALL".equalsIgnoreCase(rawStatus)) {
            return null;
        }

        try {
            return ProductReviewStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported review status");
        }
    }

    private void validateOptionalRating(Integer rating) {
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }

    private String normalizeText(String text) {
        if (text == null) {
            return null;
        }

        String normalized = text.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }

        String normalized = search.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String safeDisplayName(User user) {
        if (user == null) {
            return null;
        }

        String fullName = Stream.of(user.getFirstName(), user.getLastName())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining(" "));
        return fullName.isBlank() ? null : fullName;
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary == null || primary.isBlank() ? fallback : primary;
    }
}
