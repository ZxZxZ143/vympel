import { describe, expect, it } from "vitest";

import {
  continueMarkdownList,
  insertMarkdownLink,
  toggleHeadingMarkdown,
  toggleInlineMarkdown,
  toggleOrderedListMarkdown,
  toggleUnorderedListMarkdown,
} from "./editorTransforms";

describe("Markdown editor transforms", () => {
  it("toggles inline formatting without losing the selection", () => {
    const bold = toggleInlineMarkdown("Selected text", 0, 8, "**");
    expect(bold).toEqual({
      value: "**Selected** text",
      selectionStart: 2,
      selectionEnd: 10,
    });

    const italic = toggleInlineMarkdown(bold.value, bold.selectionStart, bold.selectionEnd, "_");
    expect(italic.value).toBe("**_Selected_** text");

    const withoutItalic = toggleInlineMarkdown(italic.value, italic.selectionStart, italic.selectionEnd, "_");
    expect(withoutItalic.value).toBe("**Selected** text");
  });

  it("adds and removes sanitized underline markup", () => {
    const underlined = toggleInlineMarkdown("Underline", 0, 9, "<u>", "</u>");
    expect(underlined.value).toBe("<u>Underline</u>");

    const plain = toggleInlineMarkdown(
      underlined.value,
      underlined.selectionStart,
      underlined.selectionEnd,
      "<u>",
      "</u>",
    );
    expect(plain.value).toBe("Underline");
  });

  it("applies and removes headings across selected lines", () => {
    const heading = toggleHeadingMarkdown("First\nSecond", 0, 12);
    expect(heading.value).toBe("## First\n## Second");
    expect(toggleHeadingMarkdown(heading.value, 0, heading.value.length).value).toBe("First\nSecond");
  });

  it("converts selected lines between bullet and numbered lists", () => {
    const bullets = toggleUnorderedListMarkdown("First\nSecond", 0, 12);
    expect(bullets.value).toBe("- First\n- Second");

    const numbered = toggleOrderedListMarkdown(bullets.value, 0, bullets.value.length);
    expect(numbered.value).toBe("1. First\n2. Second");
    expect(toggleOrderedListMarkdown(numbered.value, 0, numbered.value.length).value).toBe("First\nSecond");
  });

  it("inserts a link and selects the URL placeholder", () => {
    const result = insertMarkdownLink("Read docs", 5, 9);
    expect(result.value).toBe("Read [docs](https://)");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("https://");
  });

  it("continues bullet and numbered lists and exits an empty item", () => {
    expect(continueMarkdownList("- First", 7, 7)?.value).toBe("- First\n- ");
    expect(continueMarkdownList("3. Third", 8, 8)?.value).toBe("3. Third\n4. ");

    const empty = "- First\n- ";
    expect(continueMarkdownList(empty, empty.length, empty.length)).toEqual({
      value: "- First\n",
      selectionStart: 8,
      selectionEnd: 8,
    });
  });
});
