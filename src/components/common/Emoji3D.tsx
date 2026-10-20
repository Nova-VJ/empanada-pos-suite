import React, { useState } from "react";

export type Emoji3DName = "empanada" | "pastelito" | "malta" | "cafe";

interface Emoji3DProps {
  name: Emoji3DName;
  size?: number | string;
  className?: string;
  alt?: string;
  spin360?: boolean;
  interactive?: boolean;
  spinOnHover?: boolean;
  onClick?: () => void;
}

const EMOJI_MAP: Record<Emoji3DName, string> = {
  empanada: "/emojis/3d-empanada.png",
  pastelito: "/emojis/3d-pastelito.png",
  malta: "/emojis/3d-malta.png",
  cafe: "/emojis/3d-cafe.png",
};

const ALT_MAP: Record<Emoji3DName, string> = {
  empanada: "🥟 Empanada 3D",
  pastelito: "🥪 Pastelito 3D",
  malta: "🥤 Malta 3D",
  cafe: "☕ Café 3D",
};

export function Emoji3D({
  name,
  size = 32,
  className = "",
  alt,
  spin360 = false,
  interactive = false,
  spinOnHover = false,
  onClick,
}: Emoji3DProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const src = EMOJI_MAP[name] || EMOJI_MAP.empanada;
  const fallbackAlt = alt || ALT_MAP[name] || "emoji";

  const numSize = typeof size === "number" ? size : parseInt(String(size), 10) || 32;

  function handleClick(e: React.MouseEvent) {
    if (interactive) {
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 800);
    }
    if (onClick) onClick();
  }

  return (
    <span
      className={`inline-flex items-center justify-center select-none align-middle perspective-500 ${
        interactive ? "cursor-pointer" : ""
      } ${className}`}
      style={{
        width: `${numSize}px`,
        height: `${numSize}px`,
        perspective: "600px",
      }}
      onClick={handleClick}
      title={interactive ? "¡Tócame para girar 360°!" : fallbackAlt}
    >
      <img
        src={src}
        alt={fallbackAlt}
        width={numSize}
        height={numSize}
        loading="eager"
        className={`w-full h-full object-contain drop-shadow-md transition-all duration-300 will-change-transform ${
          spin360 ? "animate-spin-360-slow" : ""
        } ${spinOnHover ? "hover:rotate-y-180 hover:scale-115" : ""} ${
          isSpinning ? "animate-spin-360-fast" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
        }}
      />
    </span>
  );
}
