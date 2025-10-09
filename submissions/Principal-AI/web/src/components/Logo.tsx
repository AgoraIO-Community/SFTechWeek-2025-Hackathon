import { Brain } from "lucide-react";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  theme?: {
    colors: {
      primary: string;
      background: string;
    };
  };
}

export default function Logo({ width = 200, height = 200, className = "", theme }: LogoProps) {
  // Use theme colors if provided, otherwise use defaults
  const primaryColor = theme?.colors?.primary || "#3F51B5";
  const secondaryColor = theme?.colors?.primary || "#00BCD4";

  // Scale factor for icons
  const iconScale = width / 200;

  return (
    <div style={{ position: "relative", width, height }} className={className}>
      <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: secondaryColor, stopOpacity: 1 }} />
          </linearGradient>
          <filter id="shadow5" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feFlood floodColor="#333" floodOpacity="0.2"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform="translate(100, 100)" filter="url(#shadow5)">
          <path d="M 0 -60 L 52 -30 L 52 30 L 0 60 L -52 30 L -52 -30 Z" fill="url(#grad6)"/>
        </g>
      </svg>

      {/* Center Brain Icon */}
      <div style={{ position: "absolute", top: `${50}%`, left: `50%`, transform: "translate(-50%, -50%)" }}>
        <Brain size={55 * iconScale} color="white" strokeWidth={2.5} />
      </div>
    </div>
  );
}
