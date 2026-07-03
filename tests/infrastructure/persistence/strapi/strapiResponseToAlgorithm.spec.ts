import { strapiResponseToAlgorithm } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository/strapiResponseToAlgorithm';
import { ScoredAlgorithm } from '@/domain/models/Algorithm';
import { Image } from '@/domain/models/Image';

const thumbnail = new Image('placeholder.png');

const makeResponse = () => ({
  id: 1,
  attributes: {
    Title: 'Algo',
    Summary: 'summary',
    Body: '<p>body ok</p><script>alert("a")</script>',
    ShowOnHomeScreen: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    publishedAt: '2023-01-01T00:00:00.000Z',
    AlgorithmId: '00000000-0000-0000-0000-000000000001',
    Thumbnail: { data: null },
    outcomes: [
      {
        id: 1,
        Title: 'Outcome',
        Body: '<p>outcome ok</p><script>alert("o")</script>',
        next: { data: null },
        criterion: { id: 1, Type: 'None' as const, Value: null },
      },
    ],
    switches: [
      {
        id: 1,
        Label: 'Switch',
        Description: '<p>desc ok</p><img src="x" onerror="alert(1)" />',
        levels: [{ id: 1, Label: 'Lvl', Value: 1 }],
      },
    ],
    citations: [],
  },
});

describe('strapiResponseToAlgorithm terminal behavior', () => {
  it('marks a next-less outcome tagged Halt as halting the pathway', () => {
    const response = makeResponse();
    (response.attributes.outcomes[0] as any).TerminalBehavior = 'Halt';
    const algo = strapiResponseToAlgorithm(thumbnail, 'host', response);
    expect(algo.getOutcomes()[0].haltsPathway()).toBe(true);
  });

  it('treats absent/null/Complete TerminalBehavior as a completable terminal outcome', () => {
    const absent = strapiResponseToAlgorithm(thumbnail, 'host', makeResponse());
    expect(absent.getOutcomes()[0].haltsPathway()).toBe(false);

    const nullResponse = makeResponse();
    (nullResponse.attributes.outcomes[0] as any).TerminalBehavior = null;
    const nulled = strapiResponseToAlgorithm(thumbnail, 'host', nullResponse);
    expect(nulled.getOutcomes()[0].haltsPathway()).toBe(false);

    const completeResponse = makeResponse();
    (completeResponse.attributes.outcomes[0] as any).TerminalBehavior = 'Complete';
    const complete = strapiResponseToAlgorithm(thumbnail, 'host', completeResponse);
    expect(complete.getOutcomes()[0].haltsPathway()).toBe(false);
  });

  it('never halts an outcome that has a next algorithm, even if tagged Halt', () => {
    const response = makeResponse();
    (response.attributes.outcomes[0] as any).TerminalBehavior = 'Halt';
    response.attributes.outcomes[0].next = { data: { id: 2 } } as any;
    const algo = strapiResponseToAlgorithm(thumbnail, 'host', response);
    expect(algo.getOutcomes()[0].haltsPathway()).toBe(false);
  });
});

describe('strapiResponseToAlgorithm sanitization', () => {
  it('strips script from the algorithm body', () => {
    const algo = strapiResponseToAlgorithm(thumbnail, 'host', makeResponse());
    expect(algo.getBody()).toContain('<p>body ok</p>');
    expect(algo.getBody()).not.toContain('<script');
  });

  it('strips dangerous markup from switch descriptions and outcome bodies', () => {
    const algo = strapiResponseToAlgorithm(
      thumbnail,
      'host',
      makeResponse()
    ) as ScoredAlgorithm;

    const description = algo.getSwitches()[0].getDescription();
    expect(description).toContain('<p>desc ok</p>');
    expect(description).not.toContain('onerror');

    const outcomeBody = algo.getOutcomes()[0].getBody();
    expect(outcomeBody).toContain('<p>outcome ok</p>');
    expect(outcomeBody).not.toContain('<script');
  });
});
