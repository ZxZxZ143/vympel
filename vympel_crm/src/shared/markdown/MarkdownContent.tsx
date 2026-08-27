import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { markdownSanitizationSchema } from "./markdownSanitization";

type MarkdownContentProps = {
  value: string;
  className?: string;
};

export function MarkdownContent({ value, className }: MarkdownContentProps) {
  if (!value.trim()) {
    return null;
  }

  const classes = ["crm-markdown-content", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizationSchema]]}
        components={{
          a: ({ node, ...props }) => {
            void node;

            return <a {...props} rel="nofollow noopener noreferrer" />;
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
