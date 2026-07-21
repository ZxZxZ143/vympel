package com.shop.vympel.converter;

import com.shop.vympel.enums.Language;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class LanguageConverter implements Converter<String, Language> {
    @Override
    public Language convert(String source) {
        return Language.from(source);
    }
}