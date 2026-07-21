package com.shop.vympel.services.request;

import com.shop.vympel.db.entity.CustomerRequest;
import com.shop.vympel.db.entity.auth.User;
import com.shop.vympel.db.repositories.CustomerRequestRepository;
import com.shop.vympel.db.repositories.user.UserRepository;
import com.shop.vympel.dtos.request.CrmCustomerRequestResponse;
import com.shop.vympel.dtos.request.PublicCustomerRequestCreateRequest;
import com.shop.vympel.dtos.request.PublicCustomerRequestResponse;
import com.shop.vympel.enums.CustomerRequestStatus;
import com.shop.vympel.exceptions.ResourceNotFoundException;
import com.shop.vympel.security.ratelimit.AbuseProtectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomerRequestService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s<>]+@[^@\\s<>]+\\.[^@\\s<>]+$");
    private static final Pattern HTML_PATTERN = Pattern.compile("[<>]");

    private final CustomerRequestRepository customerRequestRepository;
    private final UserRepository userRepository;
    private final AbuseProtectionService abuseProtectionService;

    @Transactional
    public PublicCustomerRequestResponse create(PublicCustomerRequestCreateRequest request) {
        if (normalize(request.website()) != null) {
            throw new IllegalArgumentException("Invalid request");
        }

        String name = normalize(request.name());
        String email = normalizeEmail(request.email());
        String phone = normalizePhone(request.phone());
        String message = normalize(request.message());
        String source = normalize(request.source());

        requireNoHtml(name, "Name must not contain HTML");
        requireNoHtml(email, "Email must not contain HTML");
        requireNoHtml(phone, "Phone must not contain HTML");
        requireNoHtml(message, "Message must not contain HTML");

        if (email == null && phone == null) {
            throw new IllegalArgumentException("Email or phone is required");
        }

        abuseProtectionService.enforceCustomerRequestContact(email, phone);

        CustomerRequest entity = new CustomerRequest();
        entity.setName(name);
        entity.setEmail(email);
        entity.setPhone(phone);
        entity.setMessage(message);
        entity.setSource(source);
        entity.setStatus(CustomerRequestStatus.NEW);

        CustomerRequest saved = customerRequestRepository.save(entity);
        return new PublicCustomerRequestResponse(saved.getId(), saved.getStatus().name());
    }

    @Transactional(readOnly = true)
    public Page<CrmCustomerRequestResponse> getForCrm(String rawStatus, String rawSearch, Pageable pageable) {
        CustomerRequestStatus status = parseOptionalStatus(rawStatus);
        String search = normalize(rawSearch);

        Specification<CustomerRequest> specification = (root, query, cb) -> cb.conjunction();
        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null) {
            specification = specification.and((root, query, cb) -> {
                String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
                return cb.or(
                        cb.like(cb.lower(root.<String>get("name")), pattern),
                        cb.like(cb.lower(root.<String>get("email")), pattern),
                        cb.like(cb.lower(root.<String>get("phone")), pattern),
                        cb.like(cb.lower(root.<String>get("message")), pattern),
                        cb.like(cb.lower(root.<String>get("source")), pattern)
                );
            });
        }

        return customerRequestRepository.findAll(specification, pageable)
                .map(this::toCrmResponse);
    }

    @Transactional(readOnly = true)
    public CrmCustomerRequestResponse getOne(Long id) {
        return toCrmResponse(getExisting(id));
    }

    @Transactional(readOnly = true)
    public long newCount() {
        return customerRequestRepository.countByStatus(CustomerRequestStatus.NEW);
    }

    @Transactional
    public CrmCustomerRequestResponse updateStatus(Long id, String rawStatus, Authentication authentication) {
        CustomerRequest request = getExisting(id);
        CustomerRequestStatus status = parseRequiredStatus(rawStatus);
        request.setStatus(status);

        if (status == CustomerRequestStatus.DONE || status == CustomerRequestStatus.CANCELLED) {
            request.setProcessedAt(Instant.now());
            request.setProcessedBy(authenticatedUser(authentication));
        } else if (status == CustomerRequestStatus.NEW) {
            request.setProcessedAt(null);
            request.setProcessedBy(null);
        }

        return toCrmResponse(customerRequestRepository.save(request));
    }

    @Transactional
    public CrmCustomerRequestResponse updateComment(Long id, String rawComment) {
        CustomerRequest request = getExisting(id);
        String comment = normalize(rawComment);
        requireNoHtml(comment, "Comment must not contain HTML");
        request.setAdminComment(comment);
        return toCrmResponse(customerRequestRepository.save(request));
    }

    private CustomerRequest getExisting(Long id) {
        return customerRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
    }

    private CrmCustomerRequestResponse toCrmResponse(CustomerRequest request) {
        User processedBy = request.getProcessedBy();
        return new CrmCustomerRequestResponse(
                request.getId(),
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getMessage(),
                request.getSource(),
                request.getStatus().name(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getProcessedAt(),
                processedBy == null ? null : firstNonBlank(safeDisplayName(processedBy), processedBy.getEmail()),
                request.getAdminComment()
        );
    }

    private CustomerRequestStatus parseOptionalStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank() || "ALL".equalsIgnoreCase(rawStatus)) {
            return null;
        }
        return parseRequiredStatus(rawStatus);
    }

    private CustomerRequestStatus parseRequiredStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new IllegalArgumentException("Request status is required");
        }
        try {
            return CustomerRequestStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported request status");
        }
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

    private String normalizeEmail(String email) {
        String normalized = normalize(email);
        if (normalized == null) {
            return null;
        }

        String lowered = normalized.toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(lowered).matches()) {
            throw new IllegalArgumentException("Email is invalid");
        }
        return lowered;
    }

    private String normalizePhone(String phone) {
        String normalized = normalize(phone);
        if (normalized == null) {
            return null;
        }

        long digitCount = normalized.chars().filter(Character::isDigit).count();
        if (digitCount < 5 || digitCount > 20) {
            throw new IllegalArgumentException("Phone is invalid");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private void requireNoHtml(String value, String message) {
        if (value != null && HTML_PATTERN.matcher(value).find()) {
            throw new IllegalArgumentException(message);
        }
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
