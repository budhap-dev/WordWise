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

  it("shows every example sentence, not just the learner's role", () => {
    const word = getWord('succinct')!;
    render(<WordDetails word={word} roles={['student']} />);
    const section = screen.getByRole('heading', { name: /example sentences/i }).closest('section')!;
    expect(within(section).getAllByRole('listitem')).toHaveLength(word.examples.length);
  });

  it('lists synonyms and antonyms', () => {
    const word = getWord('succinct')!;
    render(<WordDetails word={word} roles={['student']} />);
    const synonyms = screen.getByRole('heading', { name: /synonyms/i }).closest('section')!;
    expect(within(synonyms).getByText('concise')).toBeInTheDocument();
    const antonyms = screen.getByRole('heading', { name: /antonyms/i }).closest('section')!;
    expect(within(antonyms).getByText('verbose')).toBeInTheDocument();
    expect(within(antonyms).getByText(/more critical/i)).toBeInTheDocument();
  });

  it('leaves antonyms out when a word has none', () => {
    const word = getWord('caveat')!;
    expect(word.antonyms).toBeUndefined();
    render(<WordDetails word={word} roles={['student']} />);
    expect(screen.queryByRole('heading', { name: /antonyms/i })).not.toBeInTheDocument();
  });
});
