// The 3i mark: the rounded "3" with a dot, traced from The 3i Show logo.
// Swap LOGO_PATH for the official vector if the brand team supplies one; the
// intro particle animation samples this same path.

// Path coordinates are in the reference artwork's space; the viewBox crops
// to the mark's bounds.
export const LOGO_VIEWBOX = { x: 99, y: 112, width: 543, height: 646 } as const;

export const LOGO_PATH =
  "M 99 440 a 73 73 0 1 0 146 0 a 73 73 0 1 0 -146 0 Z " +
  "M 330 118 C 520 112 640 170 640 285 C 640 355 592 396 552 418 C 522 434 522 448 552 464 " +
  "C 596 488 642 530 642 600 C 642 700 540 758 400 758 C 330 758 245 745 245 690 " +
  "C 245 645 275 625 320 625 C 355 625 380 625 400 618 C 430 608 442 585 440 562 " +
  "C 438 535 410 515 370 508 C 320 500 287 480 287 440 C 287 400 320 380 370 372 " +
  "C 410 365 437 345 435 318 C 433 290 415 272 385 266 C 360 261 330 262 305 258 " +
  "C 270 252 245 230 245 190 C 245 145 280 118 330 118 Z";

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`${LOGO_VIEWBOX.x} ${LOGO_VIEWBOX.y} ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
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
