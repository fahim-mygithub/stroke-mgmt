/**
 * @jest-environment jsdom
 */
import fs from 'fs';
import path from 'path';

/**
 * The algorithm WebView is a fixed-height box (`<View style={{height}}>` with
 * `scrollEnabled={false}`), and the only thing that tells React Native how tall
 * to make it is a `layout` message posted from inside the document. If content
 * grows after the last message, the extra height is clipped with no recovery.
 *
 * These specs run `partials/script.ejs` verbatim in jsdom and count the
 * messages that cross the bridge. jsdom has no layout engine, so
 * `body.offsetHeight` is stubbed with a value the test controls.
 */
const SCRIPT_PATH = path.join(
  __dirname,
  '../../../src/infrastructure/rendering/ejs/EjsRenderer/partials/script.ejs'
);

type LayoutMessage = { type: string; content: { width: number; height: number } };

function readScriptBody(): string {
  const raw = fs.readFileSync(SCRIPT_PATH, 'utf8');
  return raw.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
}

function stubBodyHeight(initial: number) {
  const state = { height: initial };
  Object.defineProperty(document.body, 'offsetHeight', {
    configurable: true,
    get: () => state.height,
  });
  Object.defineProperty(document.body, 'offsetWidth', {
    configurable: true,
    get: () => 390,
  });
  return state;
}

function installBridge() {
  const messages: LayoutMessage[] = [];
  (window as unknown as Record<string, unknown>).ReactNativeWebView = {
    postMessage: (data: string) => messages.push(JSON.parse(data)),
  };
  return {
    all: messages,
    layouts: () => messages.filter((m) => m.type === 'layout'),
    heights: () =>
      messages.filter((m) => m.type === 'layout').map((m) => m.content.height),
  };
}

const runScript = () => {
  // The subject under test is a script the app injects into a WebView, so
  // evaluating it is the only way to exercise it. Its body is read from the
  // repo, never from input.
  // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
  new Function(readScriptBody())();
};

// The observers below schedule their work off the current task, so tests wait
// a frame before asserting.
const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

function el<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`fixture is missing ${selector}`);
  return found;
}

describe('algorithm height contract (partials/script.ejs)', () => {
  // Each run of the script registers window listeners and observers that would
  // otherwise outlive the test and post into the next test's bridge. Record the
  // registrations so they can be torn down, and swap in a fresh <body> so the
  // previous run's observers end up watching a detached node.
  const registered: Array<() => void> = [];

  beforeEach(() => {
    const add = window.addEventListener.bind(window);
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type: string, fn, opts) => {
        add(type, fn as EventListener, opts);
        registered.push(() =>
          window.removeEventListener(type, fn as EventListener, opts)
        );
      });
  });

  afterEach(() => {
    registered.forEach((remove) => remove());
    registered.length = 0;
    document.body.replaceWith(document.createElement('body'));
    jest.restoreAllMocks();
  });

  it('reports a height as soon as the document parses', () => {
    document.body.innerHTML = '<main><p>content</p></main>';
    stubBodyHeight(120);
    const bridge = installBridge();

    runScript();

    expect(bridge.heights()).toEqual([120]);
  });

  it('re-reports the height when an image finishes loading', async () => {
    // Every image the CMS emits is a bare `<img src alt>` with no dimensions,
    // so before its bytes land it occupies zero height. The first measurement
    // is therefore always short by the full rendered height of the image.
    document.body.innerHTML =
      '<main><p><img id="i" src="https://cms.test/wide.png" alt=""></p></main>';
    const size = stubBodyHeight(120);
    const bridge = installBridge();

    runScript();
    expect(bridge.heights()).toEqual([120]);

    size.height = 520;
    el('#i').dispatchEvent(new Event('load'));
    await settle();

    expect(bridge.heights()).toEqual([120, 520]);
  });

  it('re-reports the height when an image fails to load', async () => {
    // A broken image collapses the space the layout had reserved for it; the
    // container must shrink to match or it leaves a gap.
    document.body.innerHTML =
      '<main><p><img id="i" src="https://cms.test/gone.png" alt=""></p></main>';
    const size = stubBodyHeight(520);
    const bridge = installBridge();

    runScript();

    size.height = 120;
    el('#i').dispatchEvent(new Event('error'));
    await settle();

    expect(bridge.heights()).toEqual([520, 120]);
  });

  it('re-reports the height for images revealed by expanding an outcome', async () => {
    document.body.innerHTML = `
      <details id="d" class="template outcomes__item">
        <summary>Outcome</summary>
        <div class="template outcomes__body">
          <p><img id="i" src="https://cms.test/wide.png" alt=""></p>
        </div>
      </details>`;
    const size = stubBodyHeight(60);
    const bridge = installBridge();

    runScript();

    // Expanding measures immediately, which is correct only if the image has
    // already decoded. On a cold cache it has not.
    size.height = 90;
    el('#d').setAttribute('open', '');
    await settle();

    size.height = 420;
    el('#i').dispatchEvent(new Event('load'));
    await settle();

    expect(bridge.heights()).toEqual([60, 90, 420]);
  });

  it('does not cross the bridge when the height has not changed', async () => {
    document.body.innerHTML =
      '<main><p><img id="i" src="https://cms.test/wide.png" alt=""></p></main>';
    stubBodyHeight(120);
    const bridge = installBridge();

    runScript();

    // Each message re-renders the native view, so an unchanged height must not
    // be reported. Nothing here changes the stub.
    el('#i').dispatchEvent(new Event('load'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('load'));
    await settle();

    expect(bridge.heights()).toEqual([120]);
  });

  it('picks up late content growth through a ResizeObserver when available', async () => {
    document.body.innerHTML = '<main><p>content</p></main>';
    const size = stubBodyHeight(120);
    const bridge = installBridge();

    // jsdom has no ResizeObserver; stand one in so the observed callback can be
    // fired the way a real engine would after a reflow.
    const callbacks: Array<() => void> = [];
    (window as unknown as Record<string, unknown>).ResizeObserver = class {
      constructor(cb: () => void) {
        callbacks.push(cb);
      }

      observe() {}

      disconnect() {}
    };

    runScript();
    expect(callbacks.length).toBeGreaterThan(0);

    size.height = 300;
    callbacks.forEach((cb) => cb());
    await settle();

    expect(bridge.heights()).toEqual([120, 300]);
    delete (window as unknown as Record<string, unknown>).ResizeObserver;
  });

  it('does not throw on a document containing an iframe', () => {
    // The connectivity wrapper iterated with `for (const i = 0; ...; i++)`,
    // which throws on the first increment — and the page's own error bridge
    // escalates that into a thrown WebViewError, replacing the whole screen.
    document.body.innerHTML =
      '<main><iframe src="https://www.youtube.com/embed/x"></iframe></main>';
    stubBodyHeight(300);
    installBridge();

    expect(runScript).not.toThrow();
  });

  it('wraps iframes so the offline placeholder can be applied', () => {
    document.body.innerHTML =
      '<main><iframe src="https://www.youtube.com/embed/x"></iframe></main>';
    stubBodyHeight(300);
    installBridge();

    runScript();

    expect(document.querySelectorAll('.iframe__wrapper')).toHaveLength(1);
  });
});
