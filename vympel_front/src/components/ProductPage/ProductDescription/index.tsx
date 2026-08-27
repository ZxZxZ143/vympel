import {IProductDescription} from "@/api/types/ProductTypes";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import {markdownSanitizationSchema} from "@/lib/markdownSanitization";

type Props = {
    description?: IProductDescription | null;
};

const ProductDescription = ({description}: Props) => {
    const content = description?.content || description?.shortText;

    if (!content) {
        return null;
    }

    return (
        <div className="product-markdown product-long-copy text-text-primary">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizationSchema]]}
                components={{
                    a: ({node, ...props}) => {
                        void node;

                        return <a {...props} rel="nofollow noopener noreferrer"/>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default ProductDescription;
