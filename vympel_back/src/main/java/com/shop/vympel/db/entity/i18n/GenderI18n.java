package com.shop.vympel.db.entity.i18n;

import com.shop.vympel.db.entity.features.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "gender_i18n")
public class GenderI18n implements EntityI18n {
    @EmbeddedId
    private GenderI18nId id;

    @MapsId("genderId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "gender_id", nullable = false)
    private Gender gender;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;


}