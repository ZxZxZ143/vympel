package com.shop.vympel.services.objectStorage;

/** A create-only family key already holds different bytes; it is never overwritten. */
public class ResponsiveFamilyConflictException extends RuntimeException {
    public ResponsiveFamilyConflictException(String objectKey) {
        super("Responsive family object already exists with different content: " + objectKey);
    }
}
