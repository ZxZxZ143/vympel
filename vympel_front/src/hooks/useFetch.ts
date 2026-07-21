import {useEffect, useState} from "react"

type UseFetchResult<E = unknown> = {
    loading: boolean
    error: E | null
}

type UseFetchOptions = { enabled?: boolean }

export function useFetch<TData, TError = unknown>(
    fetchFn: () => Promise<TData>,
    onSuccess: (data: TData) => void,
    options: UseFetchOptions = {}
): UseFetchResult<TError> {
    const { enabled = true } = options

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<TError | null>(null)

    useEffect(() => {
        if (!enabled) return
        let isMounted = true

        const load = async () => {
            try {
                setLoading(true)
                setError(null)

                const data = await fetchFn()

                if (!isMounted) return
                onSuccess(data)
            } catch (err) {
                if (!isMounted) return
                setError(err as TError)
            } finally {
                if (!isMounted) return
                setLoading(false)
            }
        }

        load().then()

        return () => {
            isMounted = false
        }
    }, [enabled, fetchFn, onSuccess])

    return { loading, error }
}
