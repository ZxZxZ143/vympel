import { useCallback, useEffect, useState } from "react"
import type { EmblaCarouselType } from "embla-carousel"

export const useAutoplay = (emblaApi: EmblaCarouselType | undefined) => {
    const [autoplayIsPlaying, setAutoplayIsPlaying] = useState(false)

    const autoplay = useCallback(() => emblaApi?.plugins()?.autoplay, [emblaApi])

    const stop = useCallback(() => {
        const a = autoplay()
        if (!a) return
        a.stop()
    }, [autoplay])

    const play = useCallback(() => {
        const a = autoplay()
        if (!a) return
        a.play()
    }, [autoplay])

    const onUserAction = useCallback(
        (callback?: () => void) => {
            stop()
            callback?.()
        },
        [stop]
    )

    useEffect(() => {
        const autoplay = emblaApi?.plugins()?.autoplay
        if (!autoplay) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAutoplayIsPlaying(autoplay.isPlaying())
        emblaApi
            .on('autoplay:play', () => setAutoplayIsPlaying(true))
            .on('autoplay:stop', () => setAutoplayIsPlaying(false))
    }, [emblaApi])

    return { autoplayIsPlaying, play, stop, onUserAction }
}
