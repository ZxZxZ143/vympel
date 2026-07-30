import {MarketplacesType} from "@/components/MarketPlaces/type";
import {MARKETPLACE_LINKS} from "@/config/routes";

export const MarketPlacesConfig: Array<MarketplacesType> = [
    {
        id: "kaspi",
        name: "Kaspi",
        img: "/kaspi.png",
        link: MARKETPLACE_LINKS.kaspi,
    },
    {
        id: "wildberries",
        name: "Wildberries",
        img: "/wb.png",
        link: MARKETPLACE_LINKS.wildberries,
    }
]
