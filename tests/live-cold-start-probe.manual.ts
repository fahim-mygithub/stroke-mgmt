/**
 * TEMPORARY live-CMS probe — reproduces the iOS cold-start fetch sequence
 * against production Strapi to find which mapper throws
 * "Cannot read property 'data' of undefined". Delete after diagnosis.
 */
import { StrapiPlaceholderImageRepository } from '@/infrastructure/persistence/strapi/StrapiPlaceholderImageRepository/StrapiPlaceholderImageRepository';
import { StrapiArticleRepository } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository';
import { StrapiAlgorithmRepository } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository';
import { StrapiTagRepository } from '@/infrastructure/persistence/strapi/StrapiTagRepository';
import { StrapiIntroSequenceRepository } from '@/infrastructure/persistence/strapi/StrapiIntroSequenceRepository/StrapiIntroSequenceRepository';
import { ArticleId } from '@/domain/models/Article';

const HOST = 'https://stroke-mgmt-cms.a2hosted.com';
const networkInfo = { isInternetReachable: async () => true } as never;

// jest-expo's fetch polyfill can't do real network I/O in Node; hand-roll a
// minimal fetch on node:https that supports exactly what the repos use
// (GET url -> { ok, json() }).
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const https = require('node:https');
const nodeFetch = (url: string) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res: any) => {
        let body = '';
        res.on('data', (c: any) => {
          body += c;
        });
        res.on('end', () =>
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(body),
          })
        );
      })
      .on('error', reject);
  });
const f = nodeFetch as never;
// The placeholder repo uses global fetch internally — patch it for the probe.
(globalThis as any).fetch = nodeFetch;

jest.setTimeout(60000);

describe('LIVE cold-start probe (temporary)', () => {
  const placeholders = new StrapiPlaceholderImageRepository(HOST);

  it('placeholder images', async () => {
    await expect(placeholders.getAll()).resolves.toBeTruthy();
  });

  it('algorithms shown on home screen', async () => {
    const repo = new StrapiAlgorithmRepository(HOST, f, placeholders as never, networkInfo);
    await expect(repo.getAllShownOnHomeScreen()).resolves.toBeTruthy();
  });

  it('all algorithms', async () => {
    const repo = new StrapiAlgorithmRepository(HOST, f, placeholders as never, networkInfo);
    await expect(repo.getAll()).resolves.toBeTruthy();
  });

  it('all articles', async () => {
    const repo = new StrapiArticleRepository(HOST, f, placeholders, networkInfo);
    await expect(repo.getAll()).resolves.toBeTruthy();
  });

  it('all tags', async () => {
    const repo = new StrapiTagRepository(HOST, f, networkInfo);
    await expect(repo.getAll()).resolves.toBeTruthy();
  });

  it('intro sequence', async () => {
    const repo = new StrapiIntroSequenceRepository(HOST, f, networkInfo);
    await expect(repo.get()).resolves.toBeTruthy();
  });

  it('disclaimer by designation (DisclaimerModal cold path)', async () => {
    const repo = new StrapiArticleRepository(HOST, f, placeholders, networkInfo);
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { Designation } = require('@/domain/models/Article');
    await expect(
      repo.getByDesignation(Designation.DISCLAIMER)
    ).resolves.toBeTruthy();
    await expect(
      repo.getByDesignation(Designation.ABOUT)
    ).resolves.toBeTruthy();
  });

  it('intro slide articles by id (the 7 intro slides)', async () => {
    const repo = new StrapiArticleRepository(HOST, f, placeholders, networkInfo);
    const introIds = [29, 38, 39, 28, 4, 24, 6];
    // eslint-disable-next-line no-restricted-syntax
    for (const id of introIds) {
      // eslint-disable-next-line no-await-in-loop
      await expect(repo.getById(new ArticleId(String(id)))).resolves.toBeTruthy();
    }
  });
});
