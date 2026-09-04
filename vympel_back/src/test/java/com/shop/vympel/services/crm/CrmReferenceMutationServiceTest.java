package com.shop.vympel.services.crm;

import com.shop.vympel.dtos.crm.CrmReferenceCreateRequest;
import com.shop.vympel.enums.Language;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class CrmReferenceMutationServiceTest {
    @Test
    void normalizesCaseWhitespacePunctuationAndYoForDuplicateComparison() {
        assertThat(CrmReferenceMutationService.normalize("  Ёлка—GREEN  "))
                .isEqualTo("елка green");
        assertThat(CrmReferenceMutationService.normalize("ЕЛКА   green"))
                .isEqualTo("елка green");
    }

    @Test
    void rejectsLabelsThatNormalizeToNoLettersOrDigitsBeforeTouchingTheDatabase() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        CrmReferenceMutationService service = new CrmReferenceMutationService(jdbcTemplate);

        assertThatThrownBy(() -> service.create(
                "watch-dial-types",
                new CrmReferenceCreateRequest(" !!! ", null, null),
                Language.RU
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("letter or digit");
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void rejectsHtmlLikeLabelsBeforeTouchingTheDatabase() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        CrmReferenceMutationService service = new CrmReferenceMutationService(jdbcTemplate);

        assertThatThrownBy(() -> service.create(
                "colors",
                new CrmReferenceCreateRequest("<img src=x>", null, null),
                Language.RU
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unsupported characters");
        verifyNoInteractions(jdbcTemplate);
    }
}
