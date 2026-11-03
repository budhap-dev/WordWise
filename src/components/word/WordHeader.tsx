import { CATEGORY_LABELS } from '../../data';
import type { WordEntry } from '../../types/content';
import { RegisterBadge, Tag } from './RegisterBadge';
import { SpeakButton } from './SpeakButton';

/** Term, part of speech, IPA and pronunciation, the "front of the card". */
export function WordHeader({
  word,
  as: Heading = 'h2',
  size = 'lg',
  headingId,
}: {
  word: WordEntry;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'md' | 'lg';
  headingId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Tag>{CATEGORY_LABELS[word.category]}</Tag>
          <RegisterBadge register={word.register} />
        </div>
        <Heading
          id={headingId}
          tabIndex={-1}
          className={`font-display font-semibold tracking-tight text-balance outline-none ${
            size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-3xl'
          }`}
        >
          {word.term}
        </Heading>
        <p className="mt-2 text-ink-muted">
          <span className="italic">{word.partOfSpeech}</span>
          <span aria-hidden="true"> · </span>
          <span className="tracking-wide" lang="en-GB-fonipa">
            <span className="sr-only">Pronunciation: </span>
            {word.ipa}
          </span>
        </p>
      </div>
      <SpeakButton text={word.term} size={size === 'lg' ? 'lg' : 'md'} />
    </div>
  );
}
