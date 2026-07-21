package com.shop.vympel.db.entity.i18n;

public interface EmbeddableId {
    Long getId();
    String getLang();
    void setLang(String lang);
    void setId(Long id);
}
