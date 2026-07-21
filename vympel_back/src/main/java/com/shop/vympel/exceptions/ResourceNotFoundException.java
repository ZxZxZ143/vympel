package com.shop.vympel.exceptions;

/**
 * Signals that a syntactically valid resource lookup did not resolve an entity.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
