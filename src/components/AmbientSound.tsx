import { useEffect, useRef } from "react";

interface Props {
  weatherType: string;
}

export default function AmbientSound({ weatherType }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.volume = 0.3;

    if (weatherType === "rain") {
      audio.src = "/sounds/rain.mp3";
      audio.loop = true;
      audio.play().catch(() => {});
    } else if (weatherType === "thunderstorm") {
      audio.src = "/sounds/thunder.mp3";
      audio.loop = true;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.src = "";
    }

    return () => {
      audio.pause();
    };
  }, [weatherType]);

  return <audio ref={audioRef} />;
}
