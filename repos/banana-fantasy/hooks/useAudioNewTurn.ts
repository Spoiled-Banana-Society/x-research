import { useEffect, useState } from "react"

export const useAudioNewTurn = (url: string) => {
    const [audio] = useState(new Audio(url))
    const [playing, setPlaying] = useState<boolean>(false)
    const playNewTurn = () => setPlaying(!playing)

    useEffect(() => {
        if (playing) {
            audio.play()
        } else {
            audio.pause()
        }
    }, [playing])

    useEffect(() => {
        audio.addEventListener("ended", () => setPlaying(false))

        return () => {
            audio.removeEventListener("ended", () => setPlaying(false))
        }
    }, [])

    return {
        playNewTurn,
    }
}
