package com.shop.vympel.services.cms;

import java.util.Set;

public record CmsMediaReferencesChangedEvent(Set<Long> detachedMediaIds) {
}
