import { WebViewEventHandler } from '@/infrastructure/rendering/WebViewEvent';
import { openURL } from 'expo-linking';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

const linkEvent = {
  type: 'linkpressed' as const,
  content: { href: 'https://example.com' },
};

describe('WebViewEventHandler link handling', () => {
  beforeEach(() => {
    (openURL as jest.Mock).mockClear();
  });

  it('routes a pressed link to the registered handler', () => {
    const linkpressed = jest.fn();
    const handler = new WebViewEventHandler({ linkpressed });

    handler.handle(linkEvent);

    expect(linkpressed).toHaveBeenCalledWith({ href: 'https://example.com' });
    expect(openURL).not.toHaveBeenCalled();
  });

  it('does NOT open a link when no handler is registered (no silent navigation)', () => {
    const handler = new WebViewEventHandler({});

    handler.handle(linkEvent);

    expect(openURL).not.toHaveBeenCalled();
  });
});
