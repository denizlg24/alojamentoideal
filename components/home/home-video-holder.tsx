"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import videoFallback from "@/public/frame-2.png";
import { cn } from "@/lib/utils";
export const HomeVideoHolder = () => {
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
      video.play();
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
        <Image unoptimized 
          src={videoFallback}
          alt="video-fallback"
          priority
          className="w-full object-cover lg:max-h-[600px] max-h-screen h-screen"
        />
      )}

      <video
        src="/river.mov"
        preload="true"
        className={cn(
          "w-full object-cover lg:max-h-[600px] max-h-screen h-screen",
          !videoLoaded && "hidden"
        )}
        autoPlay
        playsInline
        loop
        poster={videoFallback.src}
        muted
        ref={ref}
      >
        Not Supported
      </video>
    </>
  );
};
