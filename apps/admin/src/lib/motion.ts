import { type Transition, type Variants } from "framer-motion";

export const ease: Transition["ease"] = [0.16, 1, 0.3, 1];
export const spring: Transition = { type: "spring", stiffness: 320, damping: 28 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export const stagger = (delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease } },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

export const pressTap = { scale: 0.97 };

export const glowPulse: Variants = {
  hidden: { boxShadow: "0 0 0 0 rgba(0,245,192,0)" },
  show: {
    boxShadow: [
      "0 0 0 0 rgba(0,245,192,0)",
      "0 0 0 8px rgba(0,245,192,0.15)",
      "0 0 0 0 rgba(0,245,192,0)",
    ],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
};

export const floatY: Variants = {
  hidden: { y: 0 },
  show: {
    y: [0, -6, 0],
    transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
  },
};
