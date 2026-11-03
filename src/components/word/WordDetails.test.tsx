import { render, screen, within } from '@testing-library/react';

import { getWord } from '../../data';
import { WordDetails } from './WordDetails';

describe('WordDetails', () => {
  it('lists other meanings with an example and how to tell them apart', () => {
    const quite = getWord('quite')!;
    render(<WordDetails word={quite} roles={['everyday']} />);

    const section = screen.getByRole('heading', { name: /can also mean/i }).closest('section')!;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(quite.otherMeanings!.length);

    const completely = quite.otherMeanings![0]!;
    expect(within(section).getByText(completely.meaning)).toBeInTheDocument();
    expect(within(section).getByText(`“${completely.example}”`)).toBeInTheDocument();
    expect(within(section).getByText(completely.cue!)).toBeInTheDocument();
  });

  it('leaves the section out when a word has a single meaning', () => {
    render(<WordDetails word={getWord('succinct')!} roles={['student']} />);
    expect(screen.queryByRole('heading', { name: /can also mean/i })).not.toBeInTheDocument();
  });
});
