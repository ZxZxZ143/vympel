import React from 'react';
import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import {GoodCardProps} from "@/components/GoodCard";
import {catalogLinks} from "@/config/routes";

const items: GoodCardProps[] = [
    {
        id: 1,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    },
    {
        id: 2,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    },
    {
        id: 3,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    },
    {
        id: 4,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    },
    {
        id: 5,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    },
    {
        id: 6,
        img: "/bracelet.png",
        link: catalogLinks.accessories,
        price: 98950,
        name: "Pierre Ricaud PR162.5WZ",
        description: "Women's bracelet"
    }
]

const BraceletCarousel = () => {
    return (
        <GoodsCarouselWithImage img="/braceletBanner.webp" items={items} />
    );
};

export default BraceletCarousel;
