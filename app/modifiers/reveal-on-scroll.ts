import { modifier } from 'ember-modifier';
import { animate, inView } from 'motion';

interface RevealOnScrollSignature {
  Element: HTMLElement;
  Args: {
    Positional: [delay?: number];
  };
}

/**
 * Springs an element up into view the first time it scrolls into the
 * viewport (or immediately, when it loads above the fold). Pass a delay in
 * seconds to stagger siblings.
 */
const revealOnScroll = modifier<RevealOnScrollSignature>(
  (element, [delay = 0]) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    element.style.opacity = '0';

    const stop = inView(
      element,
      () => {
        animate(
          element,
          { opacity: [0, 1], y: [28, 0] },
          { type: 'spring', bounce: 0.25, visualDuration: 0.55, delay },
        );
      },
      { amount: 0.2 },
    );

    return () => {
      stop();
    };
  },
);

export default revealOnScroll;
