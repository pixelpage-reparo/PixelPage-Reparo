"use client"

import { useEffect, useState } from "react"

export function useOnlineStatus(): boolean {
  // Lazy initializer, not a bare `navigator.onLine` — this hook also runs
  // during Next's server-side render of this Client Component, where
  // `navigator` doesn't exist. Defaulting to "online" there means the
  // banner starts hidden and only flips on the client's own effect, exactly
  // as it would if it had first mounted online.
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
