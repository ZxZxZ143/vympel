package com.shop.vympel.db.repositories.cms;

public interface CmsMediaReferenceProjection {
    Long getBlockId();

    String getBlockKey();

    String getPageKey();

    String getBlockStatus();

    String getSlot();
}
