import { defaultSchema, type Options } from "rehype-sanitize";

const allowedMarkdownTags = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "u",
  "ul",
];

export const markdownSanitizationSchema: Options = {
  ...defaultSchema,
  tagNames: allowedMarkdownTags,
  attributes: {
    "*": [],
    a: ["href", "title"],
    code: [["className", /^language-/]],
    ol: ["start"],
  },
  protocols: {
    href: ["http", "https", "mailto", "tel"],
  },
  strip: ["script", "style"],
};
