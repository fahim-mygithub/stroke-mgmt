/**
 * Native (iOS / Android) variant — service workers are a web concept, so
 * this is a no-op. Metro picks the `.web.ts` sibling for the web bundle.
 */
export function registerServiceWorker(): void {
  /* no-op on native */
}
