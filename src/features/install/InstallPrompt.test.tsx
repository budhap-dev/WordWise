import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetInstallState } from '../../lib/install';
import { fakeInstallPrompt } from '../../test/installPrompt';
import { renderApp } from '../../test/render';

const realUserAgent = navigator.userAgent;
function pretendToBe(userAgent: string, touchPoints = 5) {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
  Object.defineProperty(navigator, 'maxTouchPoints', { value: touchPoints, configurable: true });
}

afterEach(() => {
  pretendToBe(realUserAgent, 0);
  resetInstallState();
});

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36';

describe('install card on Today', () => {
  it("isn't shown on desktop", async () => {
    renderApp();
    await screen.findByRole('heading', { name: /today's new words/i });
    expect(screen.queryByRole('heading', { name: /home screen/i })).not.toBeInTheDocument();
  });

  it('shows iPhone users how to add it from the Share menu', async () => {
    pretendToBe(IPHONE);
    const user = userEvent.setup();
    renderApp();

    expect(
      await screen.findByRole('heading', { name: /put wordwise on your home screen/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show me how/i }));
    const steps = screen.getByRole('list', { name: /install on iphone/i });
    expect(steps).toHaveTextContent(/add to home screen/i);
  });

  it('uses the browser’s own install dialog on Android', async () => {
    pretendToBe(ANDROID);
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { name: /put wordwise on your home screen/i });

    const event = await act(async () => fakeInstallPrompt('accepted'));
    await user.click(screen.getByRole('button', { name: 'Install' }));
    expect(event.prompt).toHaveBeenCalledOnce();
  });

  it('can be dismissed for a while', async () => {
    pretendToBe(IPHONE);
    const user = userEvent.setup();
    const { unmount } = renderApp();
    await screen.findByRole('heading', { name: /home screen/i });
    await user.click(screen.getAllByRole('button', { name: 'Not now' })[0]!);
    expect(screen.queryByRole('heading', { name: /home screen/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('wordwise:install-dismissed')).not.toBeNull();

    unmount();
    renderApp();
    await screen.findByRole('heading', { name: /today's new words/i });
    expect(screen.queryByRole('heading', { name: /home screen/i })).not.toBeInTheDocument();
  });

  it('disappears once installed', async () => {
    pretendToBe(ANDROID);
    renderApp();
    await screen.findByRole('heading', { name: /put wordwise on your home screen/i });
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(screen.queryByRole('heading', { name: /home screen/i })).not.toBeInTheDocument();
  });
});

describe('install section in Settings', () => {
  it('is always available, with instructions', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/settings' });
    expect(await screen.findByRole('heading', { name: /install the app/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show me how/i }));
    expect(screen.getByRole('list', { name: /how to install/i })).toHaveTextContent(/install app/i);
  });
});
