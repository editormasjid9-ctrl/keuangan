import React from 'react';

export function SidebarMosqueCrest() {
  return (
    <svg
      viewBox="0 0 180 112"
      className="w-36 h-22 mx-auto select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="domeGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5DDA6" />
          <stop offset="100%" stopColor="#D7B267" />
        </linearGradient>
        <linearGradient id="domeGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B9B67" />
          <stop offset="100%" stopColor="#1B6640" />
        </linearGradient>
        <linearGradient id="wallCream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4E7C8" />
          <stop offset="100%" stopColor="#DFC690" />
        </linearGradient>
      </defs>

      {/* Subtle glow behind dome */}
      <ellipse cx="90" cy="64" rx="64" ry="34" fill="#F5DDA6" opacity="0.09" />

      {/* Crescent moon & finial */}
      <line x1="90" y1="14" x2="90" y2="27" stroke="#F5DDA6" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M92.5 8.5a6.5 6.5 0 1 0 5.2 10.4 5.3 5.3 0 1 1-5.2-10.4z"
        fill="#F5DDA6"
      />

      {/* Left Minaret */}
      <rect x="24" y="56" width="11" height="44" rx="1.5" fill="url(#wallCream)" />
      <path d="M22.5 56h14l-2.5-6h-9l-2.5 6z" fill="#D7B267" />
      <path d="M24.5 50c0-6 5-11 5-11s5 5 5 11h-10z" fill="url(#domeGold)" />
      <line x1="29.5" y1="32" x2="29.5" y2="39" stroke="#F5DDA6" strokeWidth="1.6" />
      <rect x="27.5" y="64" width="4" height="8" rx="2" fill="#0B462D" />
      <rect x="27.5" y="78" width="4" height="9" rx="2" fill="#0B462D" />

      {/* Right Minaret */}
      <rect x="145" y="56" width="11" height="44" rx="1.5" fill="url(#wallCream)" />
      <path d="M143.5 56h14l-2.5-6h-9l-2.5 6z" fill="#D7B267" />
      <path d="M145.5 50c0-6 5-11 5-11s5 5 5 11h-10z" fill="url(#domeGold)" />
      <line x1="150.5" y1="32" x2="150.5" y2="39" stroke="#F5DDA6" strokeWidth="1.6" />
      <rect x="148.5" y="64" width="4" height="8" rx="2" fill="#0B462D" />
      <rect x="148.5" y="78" width="4" height="9" rx="2" fill="#0B462D" />

      {/* Side Domes */}
      <path d="M46 66c0-10 8-17 14-17s14 7 14 17H46z" fill="url(#domeGold)" />
      <path d="M106 66c0-10 8-17 14-17s14 7 14 17h-28z" fill="url(#domeGold)" />

      {/* Main Central Dome */}
      <path
        d="M62 66c0-22 13-37 28-37s28 15 28 37H62z"
        fill="url(#domeGold)"
      />
      <path
        d="M66 66c0-18 10.5-31 24-31s24 13 24 31H66z"
        fill="url(#domeGreen)"
        opacity="0.22"
      />
      <rect x="59" y="64" width="62" height="5" rx="1.5" fill="#E8CA82" />

      {/* Main Building Facade */}
      <rect x="38" y="69" width="104" height="31" rx="2" fill="url(#wallCream)" />

      {/* Central Grand Arch */}
      <path
        d="M78 100V81c0-6.6 5.4-12 12-12s12 5.4 12 12v19H78z"
        fill="#0A412A"
      />
      <path
        d="M82 100V83c0-4.4 3.6-8 8-8s8 3.6 8 8v17H82z"
        fill="#135A3C"
      />

      {/* Side Arches */}
      {[46, 61, 110, 125].map((x) => (
        <path
          key={x}
          d={`M${x} 100V84c0-3.3 2.7-6 6-6s6 2.7 6 6v16H${x}z`}
          fill="#0B462D"
        />
      ))}

      {/* Base Step */}
      <rect x="20" y="99" width="140" height="4" rx="2" fill="#D7B267" opacity="0.85" />
    </svg>
  );
}

export function SidebarMosqueFooter() {
  return (
    <svg
      viewBox="0 0 260 150"
      className="w-full h-auto select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6642" stopOpacity="0" />
          <stop offset="65%" stopColor="#D7B267" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#073421" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="mosqueBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFE1BE" />
          <stop offset="100%" stopColor="#B89B5E" />
        </linearGradient>
        <linearGradient id="emeraldDome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42A671" />
          <stop offset="100%" stopColor="#1D6641" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="260" height="150" fill="url(#skyGlow)" />

      {/* Soft distant hills & trees */}
      <path
        d="M0 130 Q45 112 90 126 T180 124 T260 118 V150 H0 Z"
        fill="#0D4A2F"
        opacity="0.7"
      />
      <circle cx="24" cy="116" r="14" fill="#185C3C" />
      <circle cx="38" cy="120" r="11" fill="#1E6C47" />
      <circle cx="232" cy="116" r="15" fill="#185C3C" />
      <circle cx="218" cy="121" r="11" fill="#1E6C47" />

      {/* Left Minaret */}
      <rect x="52" y="54" width="12" height="72" fill="url(#mosqueBody)" />
      <path d="M50 54h16l-2.5-6h-11l-2.5 6z" fill="#E4C684" />
      <path d="M53 48c0-7 5-12 5-12s5 5 5 12H53z" fill="url(#emeraldDome)" />
      <line x1="58" y1="29" x2="58" y2="36" stroke="#F5DDA6" strokeWidth="1.4" />

      {/* Right Minaret */}
      <rect x="196" y="54" width="12" height="72" fill="url(#mosqueBody)" />
      <path d="M194 54h16l-2.5-6h-11l-2.5 6z" fill="#E4C684" />
      <path d="M197 48c0-7 5-12 5-12s5 5 5 12h-10z" fill="url(#emeraldDome)" />
      <line x1="202" y1="29" x2="202" y2="36" stroke="#F5DDA6" strokeWidth="1.4" />

      {/* Secondary Domes */}
      <path d="M74 78c0-13 10-22 18-22s18 9 18 22H74z" fill="url(#emeraldDome)" />
      <path d="M150 78c0-13 10-22 18-22s18 9 18 22h-36z" fill="url(#emeraldDome)" />

      {/* Central Grand Dome */}
      <path d="M98 76c0-25 14-42 32-42s32 17 32 42H98z" fill="url(#emeraldDome)" />
      <line x1="130" y1="20" x2="130" y2="34" stroke="#F5DDA6" strokeWidth="1.8" />
      <circle cx="130" cy="18" r="2.5" fill="#F5DDA6" />

      {/* Main Facade */}
      <rect x="64" y="76" width="132" height="50" rx="2" fill="url(#mosqueBody)" />
      <rect x="62" y="74" width="136" height="5" rx="1" fill="#E8CA82" />

      {/* Illuminated Arch Windows */}
      {[74, 91, 108, 125, 142, 159, 176].map((x) => (
        <path
          key={x}
          d={`M${x} 126v-20c0-4.5 3.5-8 8-8s8 3.5 8 8v20H${x}z`}
          fill="#0B432B"
        />
      ))}

      {/* Warm inner light glow */}
      <path
        d="M122 126v-22c0-5 3.6-9 8-9s8 4 8 9v22h-16z"
        fill="#F6D88C"
        opacity="0.82"
      />

      {/* Courtyard reflection */}
      <rect x="0" y="126" width="260" height="24" fill="#073421" opacity="0.88" />
      <ellipse cx="130" cy="133" rx="68" ry="6" fill="#F6D88C" opacity="0.12" />
    </svg>
  );
}

export function HeaderMosqueBackdrop() {
  return (
    <svg
      viewBox="0 0 420 110"
      className="h-full w-auto text-[#0E5A3A] opacity-[0.08] pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M40 110V78h22V58c0-6 5-11 5-11s5 5 5 11v20h28V68c0-15 12-26 22-26s22 11 22 26v10h12V64c0-25 18-45 38-45s38 20 38 45v14h12V68c0-15 12-26 22-26s22 11 22 26v10h28V58c0-6 5-11 5-11s5 5 5 11v20h24v32H40z"
        fill="currentColor"
      />
      <line x1="194" y1="6" x2="194" y2="20" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function FooterBadgeEmblem() {
  return (
    <svg viewBox="0 0 36 36" className="w-8 h-8 shrink-0" aria-hidden="true">
      <line x1="18" y1="4" x2="18" y2="8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 16c0-5 3.2-8.5 7-8.5S25 11 25 16H11z" fill="#FFFFFF" />
      <rect x="6" y="12" width="3" height="17" rx="0.8" fill="#FFFFFF" opacity="0.9" />
      <rect x="27" y="12" width="3" height="17" rx="0.8" fill="#FFFFFF" opacity="0.9" />
      <rect x="10" y="17" width="16" height="12" rx="1" fill="#FFFFFF" />
      <path d="M15.5 29v-5.5a2.5 2.5 0 0 1 5 0V29h-5z" fill="#0D4F34" />
      <rect x="11.5" y="21" width="2.2" height="4" rx="1" fill="#0D4F34" />
      <rect x="22.3" y="21" width="2.2" height="4" rx="1" fill="#0D4F34" />
    </svg>
  );
}
