package com.shop.vympel.exceptions;

public class InvalidSortException extends IllegalArgumentException {
    public InvalidSortException() {
        super("Unsupported sort value.");
    }
}
