import React from 'react';
import {GoodCardProps} from "@/components/GoodCard";
import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import {catalogLinks} from "@/config/routes";

const items: GoodCardProps[] = [
    {
        id: 1,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    },
    {
        id: 2,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    },
    {
        id: 3,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    },
    {
        id: 4,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    },
    {
        id: 5,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    },
    {
        id: 6,
        img: "/case.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Ultra",
        description: "Apple Watch Series 10"
    }
]

const CaseRecommendationCarousel = () => {
    return (
        <GoodsCarouselWithImage img="/caseBanner.webp" items={items} />
    );
};

export default CaseRecommendationCarousel;
