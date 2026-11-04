/** The hub's mark: a match ball in the theme's batting colour, its stitched seam in action yellow. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="var(--bat)" />
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <path d="M9.2 4.2 C14.6 10.2 14.6 21.8 9.2 27.8" fill="none" stroke="var(--action)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M22.8 4.2 C17.4 10.2 17.4 21.8 22.8 27.8" fill="none" stroke="var(--action)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.2 4.2 C14.6 10.2 14.6 21.8 9.2 27.8" fill="none" stroke="var(--bat-ink)" strokeWidth="3.4" strokeDasharray="0.1 2.6" strokeLinecap="round" opacity="0.8" transform="translate(-1.4 0)" />
      <path d="M22.8 4.2 C17.4 10.2 17.4 21.8 22.8 27.8" fill="none" stroke="var(--bat-ink)" strokeWidth="3.4" strokeDasharray="0.1 2.6" strokeLinecap="round" opacity="0.8" transform="translate(1.4 0)" />
      <ellipse cx="11" cy="10" rx="3.2" ry="2" fill="#ffffff" opacity="0.28" transform="rotate(-35 11 10)" />
    </svg>
  );
}
