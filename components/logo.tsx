export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Lohan AI"
    >
      <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
      <path
        d="M11 8v13.5a1.5 1.5 0 0 0 1.5 1.5H21"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="21.5" cy="11" r="2" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}
