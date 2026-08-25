package com.shop.vympel.services.crm;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Defines the outer transaction for a CRM mutation and its durable audit row.
 * Controller-facing business services may already be transactional; they join
 * this boundary so either both records commit or neither does.
 */
@Service
@RequiredArgsConstructor
public class CrmAuditedMutationService {
    private final TransactionTemplate transactionTemplate;

    public <T> T execute(Supplier<T> mutation, Consumer<T> auditWriter) {
        return transactionTemplate.execute(status -> {
            T result = mutation.get();
            auditWriter.accept(result);
            return result;
        });
    }
}
