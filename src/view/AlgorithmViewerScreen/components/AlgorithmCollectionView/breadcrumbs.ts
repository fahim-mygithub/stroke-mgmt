// Pure crumb derivation for the algorithm breadcrumb bar ("Treatment path").
// Mirrors the web app's renderBreadcrumb rules: past crumbs truncate at 15
// chars + ellipsis (full title kept for accessibility), the current (last)
// crumb is never truncated, and the bar stays hidden until at least one
// algorithm title is known.

type Crumb = {
  uuid: string;
  index: number;
  /** Display text: truncated for past crumbs, full for the current one. */
  label: string;
  /** Untruncated title, for accessibility labels. */
  fullTitle: string;
  isCurrent: boolean;
};

const CRUMB_MAX_CHARS = 15;

// Placeholder while an algorithm's title hasn't loaded yet (query in flight).
const UNKNOWN_TITLE = '…';

function truncateCrumbLabel(text: string): string {
  return text.length > CRUMB_MAX_CHARS
    ? `${text.slice(0, CRUMB_MAX_CHARS)}…`
    : text;
}

function buildCrumbs(
  uuids: string[],
  titleByUuid: Record<string, string | undefined>
): Crumb[] {
  const anyTitleKnown = uuids.some((u) => titleByUuid[u] !== undefined);
  if (!anyTitleKnown) return [];
  return uuids.map((uuid, index) => {
    const isCurrent = index === uuids.length - 1;
    const fullTitle = titleByUuid[uuid] ?? UNKNOWN_TITLE;
    return {
      uuid,
      index,
      isCurrent,
      fullTitle,
      label: isCurrent ? fullTitle : truncateCrumbLabel(fullTitle),
    };
  });
}

export { buildCrumbs, truncateCrumbLabel, CRUMB_MAX_CHARS };
export type { Crumb };
