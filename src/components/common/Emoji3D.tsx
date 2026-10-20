import React from "react";

interface Emoji3DProps {
  name: "empanada" | "pastelito" | "malta";
  size?: number | string;
  className?: string;
  alt?: string;
}

const EMOJI_MAP = {
  empanada: "/emojis/3d-empanada.png",
  pastelito: "/emojis/3d-pastelito.png",
  malta: "/emojis/3d-malta.png",
};

const ALT_MAP = {
  empanada: "🥟",
  pastelito: "🥪",
  malta: "🥤",
};

export function Emoji3D({ name, size = 28, className = "", alt }: Emoji3DProps) {
  const src = EMOJI_MAP[name] || EMOJI_MAP.empanada;
  const fallbackAlt = alt || ALT_MAP[name] || "emoji";

  return (
    <img
      src={src}
      alt={fallbackAlt}
      width={size}
      height={size}
      loading="eager"
      className={`inline-block align-middle transition-transform duration-200 hover:scale-115 select-none drop-shadow-sm ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        objectFit: "contain",
      }}
    />
  );
}
