import Constants from 'expo-constants';
import { GetAllArticlesAction } from '@/application/GetAllArticlesAction';
import { GetArticleByIdAction } from '@/application/GetArticleByIdAction';
import { GetDisclaimerAction } from '@/application/GetDisclaimerAction';
import { GetAboutUsAction } from '@/application/GetAboutUsAction';
import { RenderArticleByIdAction } from '@/application/RenderArticleByIdAction';
import { RenderDisclaimerAction } from '@/application/RenderDisclaimerAction';
import { RenderAboutUsAction } from '@/application/RenderAboutUsAction';
import { ExpoAssetFileSystem } from '@/infrastructure/file-system/expo-asset/ExpoAssetFileSystem';
import { appFactory as App, rootFactory as Root } from '@/view/App';
import { factory as HomeScreen } from '@/view/HomeScreen';
import { factory as ArticleViewerScreen } from '@/view/ArticleViewerScreen';
import { factory as AlgorithmViewerScreen } from '@/view/AlgorithmViewerScreen';
import { factory as DisclaimerModal } from '@/view/DisclaimerModal';
import { factory as Router, menuFactory } from '@/view/Router';
import { factory as AboutUsScreen } from '@/view/AboutUsScreen';
import { factory as IntroSequenceScreen } from '@/view/IntroSequenceScreen';
import { factory as TreatmentSummaryScreen } from '@/view/TreatmentSummaryScreen';
import { ExpoPrintPdfExporter } from '@/infrastructure/pdf/ExpoPrintPdfExporter';
import { RenderAlgorithmAction } from '@/application/RenderAlgorithmAction';
import { GetAllAlgorithmsShownOnHomeScreenAction } from '@/application/GetAllAlgorithmsShownOnHomeScreenAction';
import { GetAlgorithmByIdAction } from '@/application/GetAlgorithmByIdAction';
import { EjsRenderer } from '@/infrastructure/rendering/ejs/EjsRenderer';
import { RenderAlgorithmByIdAction } from '@/application/RenderAlgorithmByIdAction';
import { StrapiArticleRepository } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository';
import { StrapiAlgorithmRepository } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository';
import { StrapiPlaceholderImageRepository } from '@/infrastructure/persistence/strapi/StrapiPlaceholderImageRepository/StrapiPlaceholderImageRepository';
import { GetAllTagsAction } from '@/application/GetAllTagsAction';
import { StrapiTagRepository } from '@/infrastructure/persistence/strapi/StrapiTagRepository';
import { ReactNativeNetInfo } from '@/infrastructure/network-info/react-native-netinfo/ReactNativeNetInfo';
import { ImageCache } from '@/domain/models/Image';
import {
  AlgorithmCache,
  ArticleCache,
  IntroSequenceCache,
  TagCache,
} from '@/domain/services/Cache';
import { cheerioGetImageSrcsInHtml } from '@/infrastructure/html-processing/cheerio/cheerioGetImageSrcsInHtml';
import { cheerioReplaceImageSrcsInHtml } from '@/infrastructure/html-processing/cheerio/cheerioReplaceImageSrcsInHtml';
import { ExpoFileSystemImageStore } from '@/infrastructure/file-system/expo-file-system/ExpoFileSystemImageStore';
import { ClearCacheAction } from '@/application/ClearCacheAction';
import { Platform } from 'react-native';
import { cachedRepositoryBindings } from '@/di/cachedRepositoryBindings';
import { GetIntroSequenceAction } from '@/application/GetIntroSequenceAction';
import { StrapiIntroSequenceRepository } from '@/infrastructure/persistence/strapi/StrapiIntroSequenceRepository/StrapiIntroSequenceRepository';
import { AsyncStorageCachedIntroSequenceRepository } from '@/infrastructure/persistence/async-storage/AsyncStorageCachedIntroSequenceRepository';
import {
  UpdateService,
  Version,
  postUpdateChanges,
} from '@/application/UpdateService';
import { AsyncStorageVersionRepository } from '@/infrastructure/persistence/async-storage/AsyncStorageVersionRepository';

const production = Constants.expoConfig?.extra?.NODE_ENV !== 'development';

const localhost = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

const liveCmsUrl = 'https://stroke-mgmt-cms.a2hosted.com';

// Development normally points at a local Strapi, but that only exists if a
// developer is actually running one. To avoid every CMS fetch failing (which
// makes the home/algorithm/article screens "error out") when there is no local
// server, dev falls back to the live CMS by default. Opt back in to the local
// Strapi by setting EXPO_PUBLIC_USE_LOCAL_CMS=true.
const useLocalCms = process.env.EXPO_PUBLIC_USE_LOCAL_CMS === 'true';

function forward(key: string) {
  const identity = (i: unknown) => i;
  identity.$inject = [key];
  return identity;
}

export const module = {
  // CONFIG
  strapiHostUrl: [
    'value',
    !production && useLocalCms ? `http://${localhost}:1337` : liveCmsUrl,
  ],
  currentVersion: ['value', new Version(1, 1, 2)],

  // DOMAIN
  imageCache: ['type', ImageCache],
  articleCache: ['type', ArticleCache],
  tagCache: ['type', TagCache],
  algorithmCache: ['type', AlgorithmCache],
  introSequenceCache: ['type', IntroSequenceCache],

  // APPLICATION
  getAllArticlesAction: ['type', GetAllArticlesAction],
  getArticleByIdAction: ['type', GetArticleByIdAction],
  getDisclaimerAction: ['type', GetDisclaimerAction],
  getAboutUsAction: ['type', GetAboutUsAction],
  getAllAlgorithmsShownOnHomeScreenAction: [
    'type',
    GetAllAlgorithmsShownOnHomeScreenAction,
  ],
  getAlgorithmByIdAction: ['type', GetAlgorithmByIdAction],
  getAllTagsAction: ['type', GetAllTagsAction],
  getIntroSequenceAction: ['type', GetIntroSequenceAction],
  renderArticleByIdAction: ['type', RenderArticleByIdAction],
  renderAlgorithmByIdAction: ['type', RenderAlgorithmByIdAction],
  renderAlgorithmAction: ['type', RenderAlgorithmAction],
  renderDisclaimerAction: ['type', RenderDisclaimerAction],
  renderAboutUsAction: ['type', RenderAboutUsAction],
  clearCacheAction: ['type', ClearCacheAction],
  updateService: ['type', UpdateService],
  postUpdateChanges: ['value', postUpdateChanges],

  // INFRASTRUCTURE
  articleRepository: ['type', StrapiArticleRepository],
  algorithmRepository: ['type', StrapiAlgorithmRepository],
  placeholderImageRepository: ['type', StrapiPlaceholderImageRepository],
  tagRepository: ['type', StrapiTagRepository],
  introSequenceRepository: ['type', StrapiIntroSequenceRepository],
  fileSystem: ['type', ExpoAssetFileSystem],
  networkInfo: ['type', ReactNativeNetInfo],
  articleRenderer: ['factory', forward('algorithmRenderer')],
  algorithmRenderer: ['type', EjsRenderer],
  getImageSrcsInHtml: ['value', cheerioGetImageSrcsInHtml],
  replaceImageSrcsInHtml: ['value', cheerioReplaceImageSrcsInHtml],
  imageStore: ['type', ExpoFileSystemImageStore],
  pdfExporter: ['type', ExpoPrintPdfExporter],
  // Native (`cachedRepositoryBindings.ts`) → Websql* repos backed by
  // expo-sqlite. Web (`cachedRepositoryBindings.web.ts`) → IndexedDb* repos.
  ...cachedRepositoryBindings,
  cachedIntroSequenceRepository: [
    'type',
    AsyncStorageCachedIntroSequenceRepository,
  ],
  versionRepository: ['type', AsyncStorageVersionRepository],

  // TEMPLATES
  Root: ['factory', Root],
  App: ['factory', App],
  Router: ['factory', Router],
  AboutUsScreen: ['factory', AboutUsScreen],
  HomeScreen: ['factory', HomeScreen],
  DisclaimerModal: ['factory', DisclaimerModal],
  ArticleViewerScreen: ['factory', ArticleViewerScreen],
  AlgorithmViewerScreen: ['factory', AlgorithmViewerScreen],
  IntroSequenceScreen: ['factory', IntroSequenceScreen],
  TreatmentSummaryScreen: ['factory', TreatmentSummaryScreen],
  Menu: ['factory', menuFactory],

  // BUILT-INS
  // Wrapped in an arrow to preserve `this` on the web, where `fetch` is a Window
  // method and a bare reference throws "Illegal invocation" when called.
  fetch: [
    'value',
    (...args: Parameters<typeof fetch>) => fetch(...args),
  ],
};
