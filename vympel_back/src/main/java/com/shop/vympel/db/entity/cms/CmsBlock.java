package com.shop.vympel.db.entity.cms;

import com.shop.vympel.enums.CmsBlockStatus;
import com.shop.vympel.enums.CmsBlockType;
import com.shop.vympel.enums.CmsLinkOpenBehavior;
import com.shop.vympel.enums.CmsLinkType;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "cms_block")
public class CmsBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "page_id", nullable = false)
    private CmsPage page;

    @Column(name = "block_key", nullable = false, unique = true, length = 160)
    private String blockKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 40)
    private CmsBlockType blockType;

    @ColumnDefault("0")
    @PositiveOrZero
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CmsBlockStatus status = CmsBlockStatus.PUBLISHED;

    @Column(name = "settings_json", length = Integer.MAX_VALUE)
    private String settingsJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id")
    private CmsMedia media;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_kz_id")
    private CmsMedia mediaKz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_en_id")
    private CmsMedia mediaEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_media_id")
    private CmsMedia mobileMedia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_media_kz_id")
    private CmsMedia mobileMediaKz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_media_en_id")
    private CmsMedia mobileMediaEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false, length = 40)
    private CmsLinkType linkType = CmsLinkType.NONE;

    @Column(name = "link_target", length = Integer.MAX_VALUE)
    private String linkTarget;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_open_behavior", nullable = false, length = 20)
    private CmsLinkOpenBehavior linkOpenBehavior = CmsLinkOpenBehavior.SAME_TAB;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "block", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lang ASC")
    private List<CmsBlockTranslation> translations = new ArrayList<>();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
