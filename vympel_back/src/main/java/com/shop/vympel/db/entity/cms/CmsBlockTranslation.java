package com.shop.vympel.db.entity.cms;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(
        name = "cms_block_translation",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cms_block_translation_block_lang",
                columnNames = {"block_id", "lang"}
        )
)
public class CmsBlockTranslation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "block_id", nullable = false)
    private CmsBlock block;

    @Column(name = "lang", nullable = false, length = 5)
    private String lang;

    @Column(name = "title")
    private String title;

    @Column(name = "subtitle")
    private String subtitle;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "button_text", length = 160)
    private String buttonText;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "extra_json", length = Integer.MAX_VALUE)
    private String extraJson;
}
