"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import videoFallback from "@/public/video-fallback.png";
import { cn } from "@/lib/utils";
export const VideoHolder = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref?.current;

    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
    };
    if (video.readyState >= 3) {
      setVideoLoaded(true);
    } else {
      video.addEventListener("canplay", handleCanPlay);
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, []);
  return (
    <>
      {!videoLoaded && (
        <Image
          src={videoFallback}
          alt="video-fallback"
          priority
          className="w-full h-full object-cover lg:max-h-[600px] max-h-[300px]"
        />
      )}

      <video
        src="/main_vid.mp4"
        preload="true"
        className={cn(
          "w-full h-full object-cover lg:max-h-[600px] max-h-[300px]",
          !videoLoaded && "hidden"
        )}
        autoPlay
        playsInline
        loop
        muted
        ref={ref}
      >
        Not Supported
      </video>
    </>
  );
};
