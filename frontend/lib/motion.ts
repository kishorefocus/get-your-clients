/**
 * lib/motion.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Central animation library for GlobalReach CRM.
 * All Framer Motion variants live here — import from this file,
 * not per-component, so timing stays consistent everywhere.
 *
 * Duration budget:
 *   hover / toggle / toast entrance  →  120 – 400 ms
 *   page / modal / card entrance     →  200 – 600 ms
 *
 * Easing:
 *   UI feedback  →  ease-out  [0.16, 1, 0.3, 1]  (expo-ish out)
 *   Springs      →  stiffness 400, damping 30
 *   Drag release →  stiffness 300, damping 25
 * ─────────────────────────────────────────────────────────────────────────
 */

export { useReducedMotion } from "framer-motion";

// ─── Easing presets ────────────────────────────────────────────────────────

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

// ─── Shared transition bases ───────────────────────────────────────────────

export const springUI = { type: "spring", stiffness: 400, damping: 30 } as const;
export const springGentle = { type: "spring", stiffness: 300, damping: 28 } as const;
export const springBouncy = { type: "spring", stiffness: 500, damping: 22 } as const;

// ─── Page / route transition ───────────────────────────────────────────────

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12 },
  },
};

// ─── Fade variants ─────────────────────────────────────────────────────────

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.12 } },
};

export const fadeUp = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export const fadeDown = {
  hidden:  { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

// ─── Scale variants ────────────────────────────────────────────────────────

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springUI,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const scaleInSpring = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.12 },
  },
};

// ─── Slide variants (for messages, drawers) ────────────────────────────────

export const slideInRight = {
  hidden:  { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export const slideInLeft = {
  hidden:  { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

// ─── Stagger containers ────────────────────────────────────────────────────

/** Standard stagger — 50 ms between children. Good for cards / sections. */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

/** Fast stagger — 30 ms. Good for dense lists (table rows, inbox threads). */
export const staggerContainerFast = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

/** Slow stagger — 70 ms. Good for hero sections with wide spacing. */
export const staggerContainerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

// ─── Stagger child (use as variant on children of a stagger container) ─────

/** Generic stagger child — pairs with any staggerContainer above. */
export const staggerChild = fadeUp;

// ─── Hover / interactive helpers (use directly on motion components) ───────

/** Subtle lift for cards. */
export const cardHoverProps = {
  whileHover: { y: -2, transition: { duration: 0.18, ease: EASE_OUT } },
  whileTap:   { scale: 0.98 },
};

/** Heavier lift for pricing / hero cards. */
export const cardLiftProps = {
  whileHover: { y: -4, scale: 1.01, transition: { duration: 0.22, ease: EASE_OUT } },
  whileTap:   { scale: 0.99 },
};

/** Tap feedback for small interactive elements (chips, keys, icons). */
export const tapProps = {
  whileTap: { scale: 0.93, transition: { duration: 0.1 } },
};

// ─── Toast / notification variants ────────────────────────────────────────

export const toastVariant = {
  hidden:  { opacity: 0, x: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springUI,
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.9,
    transition: { duration: 0.18 },
  },
};

// ─── Kanban specific ───────────────────────────────────────────────────────

/** Applied to DragOverlay card — feels "lifted" off the board. */
export const dragOverlayStyle = {
  scale: 1.04,
  rotate: 1.5,
  boxShadow: "0 16px 48px -8px rgb(18 20 28 / 0.28)",
};

/** Drop settle — the card "lands" with a small bounce. */
export const dropSettle = {
  animate: {
    scale: [0.96, 1.02, 1],
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// ─── useCountUp hook ───────────────────────────────────────────────────────

/**
 * Animates a number from 0 to `end` over `duration` ms.
 * Respects prefers-reduced-motion — returns `end` immediately if reduced.
 *
 * Usage:
 *   const value = useCountUp(2481, inView);
 */
export function useCountUp(
  end: number,
  active: boolean,
  duration = 900
): number {
  // This is a pure JS utility — the hook is defined in lib/hooks/use-count-up.ts
  // so it can use React hooks. We re-export the type signature here for reference.
  return end; // placeholder; real impl in use-count-up.ts
}
