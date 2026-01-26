'use client'

import React from "react";

interface QuoorumLogoProps {
  className?: string;
  size?: number;
  showGradient?: boolean;
}

export function QuoorumLogo({
  className = "",
  size = 40,
  showGradient = true,
}: QuoorumLogoProps) {
  // Aplicar el mismo degradado del título principal de la landing
  // bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400
  
  // Cuando showGradient=true, usar logo completo (quoorum-logo-ok.svg)
  // Cuando showGradient=false, usar imagotipo (quoorum-imagotipo.svg)
  // Añadir cache-busting parameter para forzar recarga del logo
  const logoBase = showGradient ? "/quoorum-logo-ok.svg" : "/quoorum-imagotipo.svg"
  // Hash MD5 de los archivos para cache-busting estable:
  // quoorum-logo-ok.svg: 19DBF9111224825802DD79F0E8C58A25
  // quoorum-imagotipo.svg: AB2FFF268AB627FDD8C1CF755DC9D703
  // Usar hash + timestamp único por montaje del componente para forzar recarga
  const logoHash = showGradient ? "19DBF9111224825802DD79F0E8C58A25" : "AB2FFF268AB627FDD8C1CF755DC9D703"
  // Timestamp único por instancia del componente (se genera una vez al montar)
  const [logoVersion] = React.useState(() => Date.now())
  const logoSrc = React.useMemo(() => `${logoBase}?v=${logoHash}&t=${logoVersion}`, [logoBase, logoHash, logoVersion])

  // Usar React state para manejar el hover
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-visible group ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showGradient ? (
        <>
          {/* Glow real usando pseudo-elemento - solo visible en hover */}
          {isHovered && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)`,
                filter: 'blur(8px)',
                WebkitFilter: 'blur(8px)',
                transform: 'scale(1.3)',
                zIndex: 0,
                opacity: 1,
                transition: 'opacity 0.3s ease-out',
              }}
            />
          )}
          {/* Logo principal con gradiente - sin efectos de sombra */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 relative z-10"
            style={{
              maskImage: `url('${logoSrc}')`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url('${logoSrc}')`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
          {/* SVG invisible para mantener el espacio */}
          <img
            src={logoSrc}
            alt="Quoorum"
            width={size}
            height={size}
            className="w-full h-full object-contain opacity-0 relative z-10 pointer-events-none"
            style={{ objectFit: 'contain', objectPosition: 'center' }}
          />
        </>
      ) : (
        <img
          src={logoSrc}
          alt="Quoorum"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          style={{
            objectFit: 'contain',
            objectPosition: 'center',
            filter: 'brightness(0) invert(1)',
          }}
        />
      )}
    </div>
  );
}

export function QuoorumLogoSimple({
  className = "",
  size = 40,
}: Omit<QuoorumLogoProps, "showGradient">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified version for small sizes */}
      <path
        d="M50 20 C65 20, 75 30, 75 45 C75 60, 65 70, 50 70 C48 70, 46 69.8, 44 69.5
           M44 69.5 L50 85 L46 70 C46 70, 45 69.8, 44 69.5 Z
           M50 20 C35 20, 25 30, 25 45 C25 60, 35 70, 50 70"
        fill="currentColor"
        strokeWidth="0"
      />
      <circle cx="50" cy="45" r="15" fill="#0A0A0F" />
      <circle cx="50" cy="45" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function QuoorumIcon({
  className = "",
  size = 24,
}: Pick<QuoorumLogoProps, "className" | "size">) {
  const id = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id={`icon-gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Compact Q speech bubble for icon use */}
      <path
        d="M12 4 C16 4, 19 7, 19 11 C19 15, 16 18, 12 18 C11.5 18, 11 17.9, 10.5 17.8
           M10.5 17.8 L13 22 L11 18 C11 18, 10.7 17.9, 10.5 17.8 Z
           M12 4 C8 4, 5 7, 5 11 C5 15, 8 18, 12 18"
        fill={`url(#icon-gradient-${id})`}
      />
      <circle cx="12" cy="11" r="3" fill="#0A0A0F" />
      <circle cx="12" cy="11" r="1" fill="#22d3ee" opacity="0.8" />
    </svg>
  );
}

/**
 * QuoorumLogoWithText - Componente reutilizable con logo + texto
 * 
 * Muestra el logo de Quoorum con el texto "Quoorum" al lado, usando el mismo
 * estilo que aparece en la barra superior. El texto tiene un gradiente:
 * - "Quoo" en blanco/claro
 * - "rum" en azul/púrpura
 */
interface QuoorumLogoWithTextProps {
  /** Tamaño del icono del logo */
  iconSize?: number;
  /** Tamaño del texto (clase de Tailwind para text-*) */
  textSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** URL de destino del link (opcional) */
  href?: string;
  /** Mostrar gradiente en el logo */
  showGradient?: boolean;
  /** Mostrar solo el logo sin texto (útil para headers compactos) */
  showText?: boolean;
}

export function QuoorumLogoWithText({
  iconSize = 192, // 4x el tamaño original (48 * 4 = 192)
  textSize = '2xl',
  className = '',
  href,
  showGradient = true,
  showText = false, // Por defecto sin texto
}: QuoorumLogoWithTextProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  }

  // Calcular tamaño del contenedor: icono + padding (8px en cada lado = 16px total)
  const containerSize = iconSize + 16

  const content = (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        {/* Contenedor del logo con fondo oscuro - tamaño dinámico basado en iconSize */}
        {/* El glow ahora está aplicado directamente al SVG dentro de QuoorumLogo */}
        <div 
          className="relative rounded-2xl flex items-center justify-center bg-[var(--theme-landing-bg)] border border-white/5 overflow-visible"
          style={{ width: containerSize, height: containerSize }}
        >
          <QuoorumLogo size={iconSize} showGradient={showGradient} />
        </div>
      </div>
      {/* Texto "Quoorum" con gradiente exacto: Quoo en blanco, r transición, um en azul claro */}
      {showText && (
        <span className={`font-bold ${textSizeClasses[textSize]} bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent`}>
          Quoorum
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="w-fit">
        {content}
      </a>
    )
  }

  return content
}
