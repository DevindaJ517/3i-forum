// The 3i mark: the rounded "3" with a dot, traced from The 3i Show logo.
// Swap LOGO_PATH for the official vector if the brand team supplies one; the
// intro particle animation samples this same path.

export const LOGO_VIEWBOX = { width: 425, height: 500 } as const;

export const LOGO_PATH =
  "M 0 252 a 58 58 0 1 0 116 0 a 58 58 0 1 0 -116 0 Z " +
  "M 168 0 C 318 0 425 42 425 138 C 425 192 396 230 350 252 C 398 274 425 316 425 372 " +
  "C 425 462 322 500 200 500 L 167 500 C 137 500 113 476 113 446 C 113 416 137 392 167 392 " +
  "L 190 392 C 212 392 224 374 224 352 C 224 328 210 308 186 306 C 162 304 145 283 145 252 " +
  "C 145 221 162 200 186 198 C 210 196 224 176 224 154 C 224 130 212 110 190 110 L 168 110 " +
  "C 138 110 113 85 113 55 C 113 25 138 0 168 0 Z";

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      <path d={LOGO_PATH} />
    </svg>
  );
}
