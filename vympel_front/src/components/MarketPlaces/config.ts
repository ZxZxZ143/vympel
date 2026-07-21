import {MarketplacesType} from "@/components/MarketPlaces/type";
import {MARKETPLACE_LINKS} from "@/config/routes";

export const MarketPlacesConfig: Array<MarketplacesType> = [
    {
        id: 0,
        img: "/kaspi.png",
        className: "",
        link: MARKETPLACE_LINKS.kaspi,
    },
    {
        id: 1,
        img: "/ozon.png",
        className: "",
        link: MARKETPLACE_LINKS.ozon,
    },
    {
        id: 2,
        img: "/wb.png",
        className: "",
        link: MARKETPLACE_LINKS.wildberries,
    }

]
