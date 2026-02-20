import { useEffect, useState } from "react"

export const useAudioYourTurn = (url: string) => {
    const [audio] = useState(new Audio(url))
    const [playing, setPlaying] = useState<boolean>(false)
    const playYourTurn = () => setPlaying(!playing)

    useEffect(() => {
        playing ? audio.play() : audio.pause()
    }, [playing])

    useEffect(() => {
        audio.addEventListener("ended", () => setPlaying(false))

        return () => {
            audio.removeEventListener("ended", () => setPlaying(false))
        }
    }, [])

    return {
        playYourTurn,
    }
}
