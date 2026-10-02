export const motion = {
  spring: {
    snappy: {
      damping: 24,
      stiffness: 300,
      mass: 0.8,
    },
    bouncy: {
      damping: 18,
      stiffness: 220,
      mass: 1,
    },
    gentle: {
      damping: 28,
      stiffness: 180,
      mass: 1.1,
    },
  },
  timing: {
    instant: 100,
    quick: 200,
    normal: 300,
    deliberate: 450,
  },
} as const;
