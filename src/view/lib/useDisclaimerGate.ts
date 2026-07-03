import { useEffect } from 'react';
import { hasAcceptedDisclaimer } from '@/view/lib/disclaimerGate';

/**
 * Runs `onMustAccept` once on mount if the user has not yet accepted the medical
 * disclaimer. Wired at the app-navigation root so the gate is enforced on every
 * launch regardless of whether the intro sequence is shown or skipped.
 */
function useDisclaimerGate(onMustAccept: () => void) {
  useEffect(() => {
    let active = true;
    hasAcceptedDisclaimer().then((accepted) => {
      if (active && !accepted) onMustAccept();
    });
    return () => {
      active = false;
    };
  }, [onMustAccept]);
}

export { useDisclaimerGate };
