import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadSettings } from '../../state/settingsStorage';
import { renderApp } from '../../test/render';

describe('onboarding', () => {
  it('redirects new users to the welcome screen', () => {
    renderApp({ settings: null });
    expect(screen.getByRole('heading', { name: /exactly the right word/i })).toBeInTheDocument();
  });

  it('saves roles, goal and level, then shows today', async () => {
    const user = userEvent.setup();
    renderApp({ settings: null });

    await user.click(screen.getByRole('button', { name: /let's begin/i }));

    const cont = screen.getByRole('button', { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /teacher/i }));
    await user.click(screen.getByRole('checkbox', { name: /software professional/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.click(screen.getByRole('radio', { name: /15 words/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.click(screen.getByRole('radio', { name: /proficient/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/teacher and software professional/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show me today's word/i }));

    expect(loadSettings()).toMatchObject({
      roles: ['teacher', 'software'],
      dailyGoal: 15,
      level: 'proficient',
    });
    expect(await screen.findByText(/word of the day/i)).toBeInTheDocument();
    expect(screen.getByText(/15 words · about 9 min/i)).toBeInTheDocument();
  });

  it('offers a generic everyday role', async () => {
    const user = userEvent.setup();
    renderApp({ settings: null });
    await user.click(screen.getByRole('button', { name: /let's begin/i }));
    await user.click(screen.getByRole('checkbox', { name: /everyday life/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /show me today's word/i }));
    expect(loadSettings()).toMatchObject({ roles: ['everyday'] });
  });
});
