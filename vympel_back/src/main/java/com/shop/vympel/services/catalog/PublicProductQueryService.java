package com.shop.vympel.services.catalog;

import com.shop.vympel.db.entity.product.Product;
import com.shop.vympel.db.repositories.product.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PublicProductQueryService {
    private static final Set<String> ALLOWED_PRODUCT_SORT_PROPERTIES = Set.of(
            "id",
            "createdAt",
            "price",
            "model",
            "stockQuantity"
    );

    private final ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public Page<Product> findAll(Specification<Product> specification, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Product> query = cb.createQuery(Product.class);
        Root<Product> root = query.from(Product.class);

        if (specification != null) {
            var predicate = specification.toPredicate(root, query, cb);
            if (predicate != null) {
                query.where(predicate);
            }
        }

        query.orderBy(publicOrders(root, cb, pageable.getSort()));

        TypedQuery<Product> typedQuery = entityManager.createQuery(query);
        if (pageable.isPaged()) {
            typedQuery.setFirstResult((int) pageable.getOffset());
            typedQuery.setMaxResults(pageable.getPageSize());
        }

        List<Product> content = typedQuery.getResultList();
        long total = specification == null ? productRepository.count() : productRepository.count(specification);

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<Long> findIds(Specification<Product> specification, Pageable pageable) {
        CriteriaQuery<Long> query = idQuery(specification, pageable.getSort());
        TypedQuery<Long> typedQuery = entityManager.createQuery(query);
        if (pageable.isPaged()) {
            typedQuery.setFirstResult((int) pageable.getOffset());
            typedQuery.setMaxResults(pageable.getPageSize());
        }

        List<Long> content = typedQuery.getResultList();
        long total = specification == null ? productRepository.count() : productRepository.count(specification);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<Long> findIds(Specification<Product> specification, Sort sort, int limit) {
        return entityManager.createQuery(idQuery(specification, sort))
                .setMaxResults(limit)
                .getResultList();
    }

    private CriteriaQuery<Long> idQuery(Specification<Product> specification, Sort sort) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Product> root = query.from(Product.class);
        query.select(root.get("id"));

        if (specification != null) {
            var predicate = specification.toPredicate(root, query, cb);
            if (predicate != null) {
                query.where(predicate);
            }
        }
        query.orderBy(publicOrders(root, cb, sort));
        return query;
    }

    private List<jakarta.persistence.criteria.Order> publicOrders(
            Root<Product> root,
            CriteriaBuilder cb,
            Sort sort
    ) {
        List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();

        Expression<Integer> availabilityBucket = cb.<Integer>selectCase()
                .when(
                        cb.and(
                                cb.equal(root.get("status"), "ACTIVE"),
                                cb.greaterThan(root.<Integer>get("stockQuantity"), 0)
                        ),
                        0
                )
                .otherwise(1);

        orders.add(cb.asc(availabilityBucket));

        if (sort.isUnsorted()) {
            orders.add(cb.desc(root.get("createdAt")));
        } else {
            sort.forEach(order -> orders.add(toCriteriaOrder(root, cb, order)));
        }

        if (sort.stream().noneMatch(order -> "id".equals(normalizeProperty(order.getProperty())))) {
            orders.add(cb.desc(root.get("id")));
        }

        return orders;
    }

    @SuppressWarnings("unchecked")
    private jakarta.persistence.criteria.Order toCriteriaOrder(
            Root<Product> root,
            CriteriaBuilder cb,
            Sort.Order order
    ) {
        Path<?> path = productPath(root, order.getProperty());
        Expression<?> expression = path;

        if (order.isIgnoreCase() && String.class.equals(path.getJavaType())) {
            expression = cb.lower((Expression<String>) path);
        }

        return order.isAscending() ? cb.asc(expression) : cb.desc(expression);
    }

    private Path<?> productPath(Root<Product> root, String property) {
        String normalized = normalizeProperty(property);
        Path<?> path = root;

        for (String part : normalized.split("\\.")) {
            if (!part.isBlank()) {
                path = path.get(part);
            }
        }

        return path;
    }

    private String normalizeProperty(String property) {
        if (property == null || property.isBlank()) {
            return "createdAt";
        }

        String normalized = property.startsWith("product.")
                ? property.substring("product.".length())
                : property;
        return ALLOWED_PRODUCT_SORT_PROPERTIES.contains(normalized)
                ? normalized
                : "createdAt";
    }
}
