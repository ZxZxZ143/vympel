package com.shop.vympel.logging;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;

public class SensitiveDataMaskingLayout extends PatternLayout {
    @Override
    public String doLayout(ILoggingEvent event) {
        return SensitiveDataMasker.mask(super.doLayout(event));
    }
}
