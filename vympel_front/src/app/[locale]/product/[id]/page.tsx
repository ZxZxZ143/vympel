import React from "react";
import {notFound} from "next/navigation";

import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import ProductPage from "@/screens/ProductPage";
import {LocaleEnum} from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        id: string;
        locale: LocaleEnum;
    }>;
};

export default async function Page({params}: Props) {
    const {id, locale} = await params;
    let product = null;
    let productLoadError = false;

    try {
        product = await PublicApiController.getProduct(id, locale);
        productLoadError = !product;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }

        console.error(error);
        productLoadError = true;
    }

    return (
        <ProductPage
            productId={id}
            locale={locale}
            initialProduct={product}
            productLoadError={productLoadError}
        />
    );
}
