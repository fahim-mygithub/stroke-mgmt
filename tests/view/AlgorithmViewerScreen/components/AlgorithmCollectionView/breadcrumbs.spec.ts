import {
  buildCrumbs,
  truncateCrumbLabel,
  CRUMB_MAX_CHARS,
} from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/breadcrumbs';

describe('truncateCrumbLabel', () => {
  it('leaves short labels unchanged', () => {
    expect(truncateCrumbLabel('NIHSS')).toBe('NIHSS');
  });

  it('leaves labels at exactly the limit unchanged', () => {
    const label = 'a'.repeat(CRUMB_MAX_CHARS);
    expect(truncateCrumbLabel(label)).toBe(label);
  });

  it('truncates longer labels to the limit plus an ellipsis', () => {
    expect(truncateCrumbLabel('Thrombolysis Eligibility')).toBe(
      'Thrombolysis El…'
    );
  });
});

describe('buildCrumbs', () => {
  it('returns no crumbs for an empty chain', () => {
    expect(buildCrumbs([], {})).toEqual([]);
  });

  it('returns no crumbs while no titles are known yet', () => {
    expect(buildCrumbs(['u1', 'u2'], {})).toEqual([]);
    expect(buildCrumbs(['u1'], { u1: undefined })).toEqual([]);
  });

  it('renders a lone current crumb on the first algorithm of a fresh triage', () => {
    const crumbs = buildCrumbs(['u1'], { u1: 'Initial Triage' });
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toEqual({
      uuid: 'u1',
      index: 0,
      isCurrent: true,
      fullTitle: 'Initial Triage',
      label: 'Initial Triage',
    });
  });

  it('marks only the last crumb as current', () => {
    const crumbs = buildCrumbs(['u1', 'u2', 'u3'], {
      u1: 'A',
      u2: 'B',
      u3: 'C',
    });
    expect(crumbs.map((c) => c.isCurrent)).toEqual([false, false, true]);
    expect(crumbs.map((c) => c.index)).toEqual([0, 1, 2]);
  });

  it('truncates past crumbs but never the current one', () => {
    const long = 'Endovascular Thrombectomy Candidacy';
    const crumbs = buildCrumbs(['u1', 'u2'], { u1: long, u2: long });
    expect(crumbs[0].label).toBe('Endovascular Th…');
    expect(crumbs[0].fullTitle).toBe(long);
    expect(crumbs[1].label).toBe(long);
  });

  it('shows a placeholder for a crumb whose title has not loaded', () => {
    const crumbs = buildCrumbs(['u1', 'u2'], { u1: 'A' });
    expect(crumbs).toHaveLength(2);
    expect(crumbs[1].label).toBe('…');
    expect(crumbs[1].fullTitle).toBe('…');
  });

  it('keeps duplicate algorithm titles as separate crumbs (A→B→A chains)', () => {
    const crumbs = buildCrumbs(['u1', 'u2', 'u3'], {
      u1: 'LKW > 24 hrs',
      u2: 'B',
      u3: 'LKW > 24 hrs',
    });
    expect(crumbs.map((c) => c.uuid)).toEqual(['u1', 'u2', 'u3']);
    expect(crumbs[0].label).toBe('LKW > 24 hrs');
    expect(crumbs[2].label).toBe('LKW > 24 hrs');
  });
});
