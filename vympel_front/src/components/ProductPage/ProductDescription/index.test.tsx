import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";

import ProductDescription from ".";

describe("ProductDescription", () => {
    it("renders supported Markdown and sanitized underline HTML", () => {
        const html = renderToStaticMarkup(
            <ProductDescription
                description={{
                    content: [
                        "## ROMANSON",
                        "",
                        "**Bold** *italic* ***both*** <u>underlined</u>",
                        "",
                        "- First",
                        "- Second",
                        "",
                        "1. One",
                        "2. Two",
                        "",
                        "> Quote",
                        "",
                        "[Safe](https://example.com)",
                        "",
                        "---",
                        "",
                        "`code`",
                    ].join("\n"),
                }}
            />,
        );

        expect(html).toContain("<h2>ROMANSON</h2>");
        expect(html).toContain("<strong>Bold</strong>");
        expect(html).toContain("<em>italic</em>");
        expect(html).toContain("<em><strong>both</strong></em>");
        expect(html).toContain("<u>underlined</u>");
        expect(html).toContain("<ul>");
        expect(html).toContain("<ol>");
        expect(html).toContain("<blockquote>");
        expect(html).toContain("href=\"https://example.com\"");
        expect(html).toContain("<hr/>");
        expect(html).toContain("<code>code</code>");
        expect(html).not.toMatch(/\*\*Bold|\*italic|## ROMANSON/);
    });

    it("removes scripts, event handlers, styles, and unsafe link protocols", () => {
        const html = renderToStaticMarkup(
            <ProductDescription
                description={{
                    content: [
                        '<script>alert("script")</script>',
                        '<style>body { display: none }</style>',
                        '<u onclick="alert(1)" style="color:red">Safe underline</u>',
                        '[Unsafe](javascript:alert(1))',
                    ].join("\n"),
                }}
            />,
        );

        expect(html).toContain("<u>Safe underline</u>");
        expect(html).not.toMatch(/script|style=|onclick|javascript:/i);
    });

    it("preserves existing plain-text line breaks", () => {
        const html = renderToStaticMarkup(
            <ProductDescription description={{content: "First line\nSecond line"}}/>,
        );

        expect(html).toContain("First line<br/>\nSecond line");
    });
});
