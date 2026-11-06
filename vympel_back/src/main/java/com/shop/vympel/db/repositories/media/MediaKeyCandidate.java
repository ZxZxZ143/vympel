package com.shop.vympel.db.repositories.media;

/** A product or CMS media row and the object key observed when it was selected for conversion. */
public record MediaKeyCandidate(Long id, String objectKey) {
}
