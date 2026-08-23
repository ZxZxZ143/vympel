import Autoplay, {type AutoplayOptionsType} from "embla-carousel-autoplay";

export const HOME_BANNER_AUTOPLAY_OPTIONS = {
    delay: 5000,
    playOnInit: false,
    stopOnFocusIn: false,
    stopOnInteraction: true,
    stopOnMouseEnter: false,
} satisfies AutoplayOptionsType;

export function createHomeBannerAutoplay() {
    return Autoplay(HOME_BANNER_AUTOPLAY_OPTIONS);
}
