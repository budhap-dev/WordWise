import {
  installMethod,
  isIos,
  isMobile,
  isStandalone,
  promptInstall,
  resetInstallState,
} from './install';
import { fakeInstallPrompt } from '../test/installPrompt';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36';
const DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36';

afterEach(() => resetInstallState());

describe('device detection', () => {
  it('spots iPhones, and iPads that pretend to be Macs', () => {
    expect(isIos(IPHONE, 5)).toBe(true);
    expect(isIos(IPAD_AS_MAC, 5)).toBe(true);
    expect(isIos(IPAD_AS_MAC, 0)).toBe(false);
    expect(isIos(ANDROID, 5)).toBe(false);
  });

  it('treats phones as mobile, desktops not', () => {
    expect(isMobile(ANDROID)).toBe(true);
    expect(isMobile(IPHONE)).toBe(true);
    expect(isMobile(DESKTOP)).toBe(false);
  });
});

describe('install prompt', () => {
  it('falls back to manual instructions without a prompt', () => {
    expect(installMethod()).toBe('manual');
    expect(isStandalone()).toBe(false);
  });

  it('captures the browser prompt and shows it on request', async () => {
    const event = fakeInstallPrompt('accepted');
    expect(event.defaultPrevented).toBe(true);
    expect(installMethod()).toBe('prompt');

    await expect(promptInstall()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledOnce();
    // A prompt can only be used once.
    expect(installMethod()).toBe('manual');
    await expect(promptInstall()).resolves.toBe(false);
  });

  it('reports a dismissed prompt', async () => {
    fakeInstallPrompt('dismissed');
    await expect(promptInstall()).resolves.toBe(false);
  });

  it('knows when the app has just been installed', () => {
    fakeInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));
    expect(isStandalone()).toBe(true);
    expect(installMethod()).toBe('manual');
  });
});
