import Image from "next/image";
import planeFlyingGif from "@/public/plane_flying_gif.gif";
export default function Loading() {
  return (
    <main className="w-screen h-screen flex flex-col items-center pt-24">
      <div className="w-full max-w-3xl px-4 flex flex-col">
        <Image
          src={planeFlyingGif}
          alt="Plane flying gif"
          className="w-full max-w-3xs mx-auto object-contain h-auto rounded-xl"
        />
        <h1 className="text-base text-center w-full font-semibold mt-6">
          Loading your next holidays
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
            }}
          >
            .
          </span>
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
              animationDelay: "0.3s",
            }}
          >
            .
          </span>
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
              animationDelay: "0.6s",
            }}
          >
            .
          </span>
        </h1>
      </div>
    </main>
  );
}
