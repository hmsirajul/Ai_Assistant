import React from "react";

interface DiptiKLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const DiptiKLogo: React.FC<DiptiKLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  textClassName = ""
}) => {
  const sizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textSizeMap = {
    xs: "text-sm font-extrabold",
    sm: "text-base font-extrabold",
    md: "text-xl font-extrabold",
    lg: "text-2xl font-black",
    xl: "text-4xl font-black"
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* SVG Cyborg Emblem matching the DiptiK AI Logo */}
      <div className={`relative shrink-0 flex items-center justify-center ${sizeMap[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Left Organic Hair Gradient */}
            <linearGradient id="diptik-pink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF1E8A" />
              <stop offset="50%" stopColor="#D914D4" />
              <stop offset="100%" stopColor="#8A2BE2" />
            </linearGradient>

            {/* Right Cybernetic Blue Gradient */}
            <linearGradient id="diptik-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#0072FF" />
              <stop offset="100%" stopColor="#1A237E" />
            </linearGradient>

            {/* Glowing Sensor Red Gradient */}
            <radialGradient id="sensor-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF3D00" />
              <stop offset="60%" stopColor="#FF1744" />
              <stop offset="100%" stopColor="#B71C1C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Ring Arc (Left Pink) */}
          <path
            d="M 50 8 A 42 42 0 0 0 14 58 C 16 68 24 78 36 85 L 50 90 Z"
            fill="url(#diptik-pink)"
            opacity="0.15"
          />

          {/* Outer Ring Arc (Right Blue Cyber Mesh) */}
          <path
            d="M 50 8 A 42 42 0 0 1 88 54 C 88 70 76 84 50 90 Z"
            fill="url(#diptik-blue)"
            opacity="0.15"
          />

          {/* LEFT HALF: Organic Female Face & Flowing Hair */}
          <g>
            {/* Flowing Hair Waves */}
            <path
              d="M 50 12 C 32 12 16 28 14 50 C 12 66 22 80 34 84 C 24 72 20 54 28 36 C 34 22 42 18 50 16 Z"
              fill="url(#diptik-pink)"
            />
            <path
              d="M 50 24 C 38 24 26 36 24 52 C 22 64 28 76 38 82 C 30 70 30 56 36 44 C 40 34 46 30 50 28 Z"
              fill="url(#diptik-pink)"
              opacity="0.85"
            />
            {/* Left Face Silhouette */}
            <path
              d="M 50 28 C 42 28 36 36 36 48 C 36 60 42 76 50 84 Z"
              fill="#F8F0F8"
            />
            {/* Left Eye & Eyebrow */}
            <path d="M 39 44 C 42 41 47 41 49 44" stroke="#4A154B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 40 46 C 43 44 47 44 49 46" stroke="#1A0A2A" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44.5" cy="46.5" r="1.5" fill="#1A0A2A" />
            {/* Left Lips */}
            <path d="M 43 65 C 46 63 49 64 50 64 L 50 67 C 48 67 45 66 43 65 Z" fill="#D914D4" />
          </g>

          {/* RIGHT HALF: Cybernetic Circuit Face */}
          <g>
            {/* Right Face Silhouette */}
            <path
              d="M 50 28 C 58 28 64 36 64 48 C 64 60 58 76 50 84 Z"
              fill="#E0F7FA"
            />
            {/* Cybernetic Grid & PCB Traces */}
            <path
              d="M 50 32 L 60 32 L 66 38 L 66 52 L 58 60 L 50 60"
              stroke="url(#diptik-blue)"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M 50 44 L 56 44 L 62 50 L 62 68 L 50 76"
              stroke="#0072FF"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 66 42 L 78 42 L 84 48 L 84 64 L 70 78 L 50 86"
              stroke="url(#diptik-blue)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Circuit Nodes */}
            <circle cx="60" cy="32" r="2" fill="#00E5FF" />
            <circle cx="66" cy="38" r="2" fill="#0072FF" />
            <circle cx="58" cy="60" r="2" fill="#1A237E" />
            <circle cx="78" cy="42" r="2.5" fill="#00E5FF" />
            <circle cx="70" cy="78" r="2.5" fill="#0072FF" />

            {/* Glowing Red Ocular Sensor Eye */}
            <circle cx="56" cy="46" r="6" fill="url(#sensor-glow)" />
            <circle cx="56" cy="46" r="2.5" fill="#FF1744" />
            <circle cx="57" cy="45" r="1" fill="#FFFFFF" />

            {/* Right Lips (Robotic Segmented) */}
            <path d="M 50 64 C 52 64 55 63 57 65 L 55 67 C 53 66 51 67 50 67 Z" fill="#0072FF" />

            {/* Network Constellation Nodes on right */}
            <line x1="68" y1="36" x2="82" y2="26" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="82" y1="26" x2="86" y2="44" stroke="#0072FF" strokeWidth="0.8" />
            <line x1="86" y1="44" x2="76" y2="60" stroke="#00E5FF" strokeWidth="0.8" />
            <circle cx="82" cy="26" r="1.5" fill="#00E5FF" />
            <circle cx="86" cy="44" r="1.5" fill="#0072FF" />
            <circle cx="76" cy="60" r="1.5" fill="#00E5FF" />
          </g>

          {/* Center Dividing Line (Cyber Seam) */}
          <line x1="50" y1="14" x2="50" y2="86" stroke="#8A2BE2" strokeWidth="1" strokeDasharray="3 1" />
        </svg>

        {/* Subtle pulsing glow behind logo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-sm opacity-30 animate-pulse -z-10" />
      </div>

      {/* Typography: DiptiK AI in Gradient matching logo */}
      {showText && (
        <div className={`tracking-tight leading-none ${textSizeMap[size]} ${textClassName}`}>
          <span className="bg-gradient-to-r from-[#FF1E8A] via-[#9C27B0] to-[#0072FF] bg-clip-text text-transparent font-black">
            DiptiK
          </span>
          <span className="ml-1.5 font-extrabold bg-gradient-to-r from-[#0072FF] to-[#00C6FF] bg-clip-text text-transparent">
            AI
          </span>
        </div>
      )}
    </div>
  );
};
