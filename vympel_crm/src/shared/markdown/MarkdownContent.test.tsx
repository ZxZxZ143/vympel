// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarkdownContent } from "./MarkdownContent";

describe("MarkdownContent", () => {
  afterEach(cleanup);

  it("removes scripts, event handlers, styles, and unsafe link protocols", () => {
    const { container } = render(
      <MarkdownContent
        value={[
          '<script>alert("script")</script>',
          '<style>body { display: none }</style>',
          '<img src="x" onerror="alert(1)">',
          '<u onclick="alert(2)" style="color:red">Safe underline</u>',
          '[Unsafe](javascript:alert(3))',
          '&lt;script&gt;encoded&lt;/script&gt;',
        ].join("\n")}
      />,
    );

    expect(container.innerHTML).toContain("<u>Safe underline</u>");
    expect(container.querySelector("script, style, img, [onerror], [onclick], [style]")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.textContent).toContain("[Unsafe](javascript:alert(3))");
    expect(container.textContent).toContain("<script>encoded</script>");
  });
});
