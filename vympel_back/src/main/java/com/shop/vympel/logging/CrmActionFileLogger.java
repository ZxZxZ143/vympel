package com.shop.vympel.logging;

import com.shop.vympel.db.entity.audit.CrmActivity;
import com.shop.vympel.db.entity.auth.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class CrmActionFileLogger {
    public static final String LOGGER_NAME = "CRM_ACTIONS";

    private static final Logger LOG = LoggerFactory.getLogger(LOGGER_NAME);

    private CrmActionFileLogger() {
    }

    public static void success(CrmActivity activity) {
        User actor = activity.getActorUser();
        LOG.info(
                "action={} entityType={} entityId={} adminUserId={} adminEmail={} role={} result=SUCCESS metadata={}",
                SensitiveDataMasker.sanitizeForLog(activity.getEventType()),
                SensitiveDataMasker.sanitizeForLog(activity.getEntityType()),
                activity.getEntityId(),
                actor == null ? null : actor.getId(),
                actor == null ? "-" : SensitiveDataMasker.maskEmail(actor.getEmail()),
                SensitiveDataMasker.sanitizeForLog(activity.getActorRole()),
                SensitiveDataMasker.sanitizeMetadata(activity.getMetadata())
        );
    }

    public static void failure(String method, String path, int status) {
        LOG.warn(
                "action=CRM_HTTP_MUTATION method={} path={} result=FAILED status={}",
                SensitiveDataMasker.sanitizeForLog(method),
                SensitiveDataMasker.sanitizeForLog(path),
                status
        );
    }
}
