import {IProductDescription} from "@/api/types/ProductTypes";
import {Text} from "@/components/ui/shared/text";

type Props = {
    description?: IProductDescription | null;
};

const ProductDescription = ({description}: Props) => {
    const content = description?.content || description?.shortText;

    if (!content) {
        return null;
    }

    return (
        <Text
            colors="primary"
            size="bodyLg"
            weight="light"
            className="product-long-copy whitespace-pre-line leading-7 sm:leading-normal"
        >
            {content}
        </Text>
    );
};

export default ProductDescription;
