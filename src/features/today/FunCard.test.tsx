import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BRITISH_SAYINGS, JOKES } from '../../data';
import { FunCard } from './FunCard';

describe('FunCard', () => {
  it('reveals a joke punchline and explains it on request', async () => {
    const user = userEvent.setup();
    const joke = JOKES[0]!;
    render(<FunCard fun={{ kind: 'joke', joke }} />);

    expect(screen.getByText(joke.setup)).toBeInTheDocument();
    expect(screen.queryByText(joke.punchline)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /go on then/i }));
    expect(screen.getByText(joke.punchline)).toBeInTheDocument();
    expect(screen.getByText(joke.explanation)).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: /why is that funny/i }));
    expect(screen.getByText(joke.explanation)).toBeVisible();
  });

  it('decodes a British saying', async () => {
    const user = userEvent.setup();
    const saying = BRITISH_SAYINGS[0]!;
    render(<FunCard fun={{ kind: 'saying', saying }} />);

    expect(screen.queryByText(saying.mean)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /really mean/i }));
    expect(screen.getByText(saying.mean)).toBeInTheDocument();
  });
});
