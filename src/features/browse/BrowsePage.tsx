import { Check, ChevronRight, Clock, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '../../components/ui/Button';
import { CATEGORIES, CATEGORY_LABELS, WORDS } from '../../data';
import { dueCards } from '../../db/selectors';
import { useCards } from '../../hooks/useProgress';
import { toDateKey } from '../../lib/date';
import {
  activeFilterCount,
  fold,
  type MatchReason,
  NO_FILTERS,
  type SearchFilters,
  type SearchResult,
  searchWords,
  snippet,
  sortKey,
  type WordStatus,
} from '../../lib/search';
import { Chip } from './Chip';
import { FilterSheet } from './FilterSheet';
import { readBrowseParams, writeBrowseParams } from './params';

const REASON_LABEL: Record<MatchReason['field'], string> = {
  term: '',
  form: 'Also',
  synonym: 'Similar',
  antonym: 'Opposite',
  collocation: 'Goes with',
  topic: 'Topic',
  definition: '',
  otherMeaning: 'Can also mean',
  example: 'Example',
  origin: 'Origin',
};

/** Highlights the query inside the term, when it appears there as typed. */
function Term({ term, query }: { term: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? term.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{term}</>;
  return (
    <>
      {term.slice(0, at)}
      <mark className="rounded bg-accent/30 text-ink">{term.slice(at, at + q.length)}</mark>
      {term.slice(at + q.length)}
    </>
  );
}

function ResultRow({
  result,
  query,
  status,
}: {
  result: SearchResult;
  query: string;
  status: WordStatus;
}) {
  const { word, reason } = result;
  const label = reason ? REASON_LABEL[reason.field] : '';
  const isDue = status.due.has(word.id);
  const isLearnt = status.learnt.has(word.id);

  return (
    <li>
      <Link
        to={`/words/${word.id}`}
        className="flex min-h-16 items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-surface-2 active:scale-[0.99] active:bg-surface-2"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-semibold">
              <Term term={word.term} query={query} />
            </span>
            <span className="text-sm text-ink-muted italic">{word.partOfSpeech}</span>
          </span>
          <span className="line-clamp-2 text-sm text-ink-muted">{word.definition}</span>
          {label && reason && (
            <span className="mt-1 block truncate text-xs text-ink-muted">
              <span className="font-semibold text-ink">{label}:</span>{' '}
              {snippet(reason.text, query, 28)}
            </span>
          )}
        </span>
        {isDue ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-spark/20 px-2 py-0.5 text-xs font-semibold">
            <Clock className="size-3" aria-hidden="true" />
            Due
          </span>
        ) : (
          isLearnt && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-ink">
              <Check className="size-3" aria-hidden="true" />
              Learnt
            </span>
          )
        )}
        <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** First letter for the A–Z headings, ignoring "a", "the" and accents. */
function initial(term: string): string {
  const ch = fold(sortKey(term)).charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

function EmptyState({
  query,
  filtered,
  onClear,
}: {
  query: string;
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="animate-rise py-12 text-center">
      <p className="text-5xl" aria-hidden="true">
        🔍
      </p>
      <p className="mt-4 text-lg font-semibold">
        {query
          ? `Nothing for “${query.trim()}”. Not even a sausage.`
          : 'No words match these filters.'}
      </p>
      <p className="mt-1 text-ink-muted">
        {query
          ? 'Try a synonym, an opposite, or a word from its meaning.'
          : 'Bit of a damp squib. Try loosening them.'}
      </p>
      {filtered && (
        <Button variant="soft" className="mt-5" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const { query, filters } = useMemo(() => readBrowseParams(params), [params]);
  const deferredQuery = useDeferredValue(query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const cards = useCards();

  const status = useMemo<WordStatus>(() => {
    if (!cards) return { learnt: new Set(), due: new Set() };
    return {
      learnt: new Set(cards.map((c) => c.wordId)),
      due: new Set(dueCards(cards, toDateKey()).map((c) => c.wordId)),
    };
  }, [cards]);

  const results = useMemo(
    () => searchWords(WORDS, deferredQuery, filters, status),
    [deferredQuery, filters, status],
  );

  const update = useCallback(
    (nextQuery: string, nextFilters: SearchFilters) =>
      setParams(writeBrowseParams(nextQuery, nextFilters), { replace: true }),
    [setParams],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    filtersButton.current?.focus();
  }, []);

  // "/" jumps to the search box, as on most sites with search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchBox.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const extraFilters = activeFilterCount(filters);
  const filtered = extraFilters > 0 || filters.category !== 'all';
  const searching = deferredQuery.trim().length > 0;

  return (
    <div>
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Browse</h1>
        <p className="mt-1 text-ink-muted">
          All {WORDS.length} words and phrases. Search by word or meaning, or ask for “opposite of
          lazy” or “another word for tired”.
        </p>
      </header>

      {/* Stays under the app header while scrolling, so search is always a thumb away. */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mt-4 border-b border-line/60 bg-bg/95 px-4 pt-2 pb-3 backdrop-blur sm:top-16">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            // Enter hides the phone keyboard so the results can be seen.
            searchBox.current?.blur();
          }}
        >
          <label htmlFor="browse-search" className="sr-only">
            Search words
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              ref={searchBox}
              id="browse-search"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Search words and meanings"
              value={query}
              onChange={(e) => update(e.target.value, filters)}
              className="h-12 w-full rounded-full border border-line bg-surface pr-12 pl-12 text-base shadow-sm outline-none placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  update('', filters);
                  searchBox.current?.focus();
                }}
                className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:text-ink"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        <div className="-mx-4 mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
          <button
            ref={filtersButton}
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-label={extraFilters > 0 ? `Filters (${extraFilters} on)` : 'Filters'}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.97] ${
              extraFilters > 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface'
            }`}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {extraFilters > 0 && (
              <span
                aria-hidden="true"
                className="rounded-full bg-brand px-1.5 text-xs text-brand-ink"
              >
                {extraFilters}
              </span>
            )}
          </button>
          <div role="group" aria-label="Category" className="flex gap-2">
            <Chip
              pressed={filters.category === 'all'}
              onClick={() => update(query, { ...filters, category: 'all' })}
            >
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                pressed={filters.category === c}
                onClick={() => update(query, { ...filters, category: c })}
              >
                {CATEGORY_LABELS[c]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 px-3 text-sm text-ink-muted" aria-live="polite">
        {searching
          ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}, best first`
          : `${results.length} ${results.length === 1 ? 'word' : 'words'}, A to Z`}
      </p>

      {results.length === 0 ? (
        <EmptyState
          query={deferredQuery}
          filtered={filtered}
          onClear={() => update(query, NO_FILTERS)}
        />
      ) : (
        <ul aria-label="Words" className="mt-2">
          {results.map((r, i) => {
            const letter = initial(r.word.term);
            const showLetter =
              !searching && (i === 0 || initial(results[i - 1]!.word.term) !== letter);
            return (
              <Fragment key={r.word.id}>
                {showLetter && (
                  <li
                    aria-hidden="true"
                    className="px-3 pt-4 pb-1 font-display text-sm font-bold tracking-widest text-brand"
                  >
                    {letter}
                  </li>
                )}
                <ResultRow result={r} query={deferredQuery} status={status} />
              </Fragment>
            );
          })}
        </ul>
      )}

      {sheetOpen && (
        <FilterSheet
          filters={filters}
          onChange={(next) => update(query, next)}
          onClose={closeSheet}
          resultCount={results.length}
          counts={{ learnt: status.learnt.size, due: status.due.size }}
        />
      )}
    </div>
  );
}
