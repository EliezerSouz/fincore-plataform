import { useState, useEffect } from "react"

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Atualiza estado inicial
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    
    // Debounce para evitar loops de layout (ex: scrollbar aparecendo/sumindo)
    let timeout: NodeJS.Timeout
    const debouncedListener = () => {
        clearTimeout(timeout)
        timeout = setTimeout(listener, 100)
    }

    media.addEventListener("change", debouncedListener)
    return () => {
        media.removeEventListener("change", debouncedListener)
        clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]) 

  return matches
}
