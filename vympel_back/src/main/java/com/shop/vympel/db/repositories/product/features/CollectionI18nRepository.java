package com.shop.vympel.db.repositories.product.features;

import com.shop.vympel.db.entity.i18n.CollectionI18n;
import com.shop.vympel.db.entity.i18n.CollectionI18nId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CollectionI18nRepository extends JpaRepository<CollectionI18n, CollectionI18nId> {
    List<CollectionI18n> findAllByIdCollectionIdInAndIdLangIn(
            Collection<Long> collectionIds,
            Collection<String> languages
    );
}
