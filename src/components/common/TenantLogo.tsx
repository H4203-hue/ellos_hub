'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTenant } from '@/context/TenantContext';

interface TenantLogoProps {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const TenantLogo: React.FC<TenantLogoProps> = ({
  compact = false,
  showTagline = true,
  className = '',
}) => {
  const { workspace, tenant } = useTenant();
  const primaryColor = tenant.primaryColor || '#D4AF37';
  const logoUrl = workspace?.logo_url || tenant.logo_url || tenant.logo;
  const displayName = workspace?.name || tenant.name || 'Ellos Vocal';

  // SVG Animated Path para logo padrão de anéis/elos
  const pathDosElos = "M25,25 C25,10 45,10 50,25 C55,40 75,40 75,25 C75,10 55,10 50,25 C45,40 25,40 25,25 Z";

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={displayName}
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-slate-950 shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {displayName.substring(0, 2).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-bold tracking-tight text-white">{displayName}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {logoUrl ? (
        <div className="flex items-center justify-center py-1">
          <Image
            src={logoUrl}
            alt={displayName}
            width={160}
            height={44}
            priority
            className="h-10 w-auto object-contain"
          />
        </div>
      ) : (
        <div className="relative w-16 h-12 flex items-center justify-center">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            <path
              d={pathDosElos}
              fill="none"
              stroke={primaryColor}
              strokeWidth="4"
              strokeOpacity="0.15"
              strokeLinecap="round"
            />
            <motion.path
              d={pathDosElos}
              fill="none"
              stroke={primaryColor}
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{ pathLength: [0, 0.3, 0], pathOffset: [0, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 8px ${primaryColor}cc)` }}
            />
          </svg>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <span className="text-xl font-bold tracking-tight text-white leading-none">
          {displayName}
        </span>
        {showTagline && tenant.tagline && (
          <span
            className="text-[10px] font-medium mt-1"
            style={{ color: primaryColor }}
          >
            {tenant.tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default TenantLogo;
