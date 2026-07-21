"use client";

import GoodCard from "@/components/GoodCard";
import {IProduct} from "@/api/types/ProductTypes";
import {routes} from "@/config/routes";

type Props = {
    products: IProduct[];
};

const BrandProductsGrid = ({products}: Props) => (
    <div className="brand-product-grid mt-12">
        {products.map((product, index) => (
            <GoodCard
                key={product.id}
                id={product.id}
                img={product.imageUrl}
                name={product.name}
                collection={product.collection}
                price={product.price}
                stockQuantity={product.stockQuantity}
                status={product.status}
                ratingAverage={product.ratingAverage}
                ratingCount={product.ratingCount}
                href={routes.product(product.id)}
                priority={index < 4}
                isCatalog
            />
        ))}
    </div>
);

export default BrandProductsGrid;
