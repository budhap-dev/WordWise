/**
 * Question generators, one per practice mode. All are pure and deterministic for a given
 * `random` function, so sessions are reproducible in tests.
 */
import type { ConfusableSet, Register, RegisterPair, Role, WordEntry } from '../../types/content';
import { examplesForRoles } from '../examples';
import { shuffle } from '../random';
import { buildTermRegExp, findTerm } from '../text';
import { wordDistractors } from './distractors';
import type { ChoiceQuestion, WriteQuestion } from './types';

const OPTION_COUNT = 4;

/** Shuffles the right answer in among the wrong ones and records where it landed. */
function arrange(
  correct: string,
  wrong: readonly string[],
  random: () => number,
): { options: string[]; answer: number } {
  const options = shuffle([correct, ...wrong], random);
  return { options, answer: options.indexOf(correct) };
}

// --- Multiple-choice meaning --------------------------------------------------------------------

export function meaningQuestions(
  pool: readonly WordEntry[],
  allWords: readonly WordEntry[],
  roles: readonly Role[],
  random: () => number,
  count: number,
): ChoiceQuestion[] {
  return pool.slice(0, count).map((word) => {
    const wrong = wordDistractors(word, allWords, OPTION_COUNT - 1, random).map(
      (w) => w.definition,
    );
    const example = examplesForRoles(word, roles, { min: 1, max: 1 })[0];
    return {
      kind: 'choice',
      id: `meaning:${word.id}`,
      mode: 'meaning',
      itemId: word.id,
      wordId: word.id,
      instruction: 'What does it mean?',
      prompt: word.term,
      promptStyle: 'term',
      ...arrange(word.definition, wrong, random),
      explanation: example ? example.text : word.definition,
    };
  });
}

// --- Gap fill -----------------------------------------------------------------------------------

const PLACEHOLDER = /\b(something|someone|someone's)\b/i;
const LEADING_ARTICLE = /^(a|an|the)\s+/i;
/** A gap that is a whole utterance ("Really? ___.") is too open: many phrases would fit. */
const STANDALONE_GAP = /(^|[.?!:]\s+)___[.!?]*(\s|$)/;

/** Options are shown without a leading article; the sentence keeps its own. */
export function displayTerm(term: string): string {
  return term.replace(LEADING_ARTICLE, '');
}

/** A role-tailored example with the term blanked out, or null if none is suitable. */
export function blankedExample(
  word: WordEntry,
  roles: readonly Role[],
): { sentence: string; solution: string } | null {
  if (PLACEHOLDER.test(word.term)) return null;
  const mine = examplesForRoles(word, roles, { min: 1, max: word.examples.length });
  const ordered = [...mine, ...word.examples.filter((e) => !mine.includes(e))];
  const everywhere = new RegExp(buildTermRegExp(word).source, 'giu');
  for (const { text } of ordered) {
    // Skip sentences that use the term twice: the second use would give the game away.
    if ((text.match(everywhere) ?? []).length !== 1) continue;
    const match = findTerm(text, word);
    if (!match) continue;
    // Keep "a"/"the" outside the gap, so options read naturally after it.
    const article = LEADING_ARTICLE.exec(match.text);
    const start = match.start + (article ? article[0].length : 0);
    const sentence = `${text.slice(0, start)}___${text.slice(match.end)}`;
    if (STANDALONE_GAP.test(sentence)) continue;
    return { sentence, solution: text };
  }
  return null;
}

export function gapFillQuestions(
  pool: readonly WordEntry[],
  allWords: readonly WordEntry[],
  roles: readonly Role[],
  random: () => number,
  count: number,
): ChoiceQuestion[] {
  const out: ChoiceQuestion[] = [];
  for (const word of pool) {
    if (out.length >= count) break;
    const blanked = blankedExample(word, roles);
    if (!blanked) continue;
    const wrong = wordDistractors(word, allWords, OPTION_COUNT - 1, random, {
      sameSlotOnly: true,
      avoidSharedTopics: true,
    }).map((w) => displayTerm(w.term));
    if (wrong.length < OPTION_COUNT - 1) continue;
    out.push({
      kind: 'choice',
      id: `gap-fill:${word.id}`,
      mode: 'gap-fill',
      itemId: word.id,
      wordId: word.id,
      instruction: 'Fill the gap',
      prompt: blanked.sentence,
      promptStyle: 'sentence',
      ...arrange(displayTerm(word.term), wrong, random),
      explanation: `${word.term}: ${word.definition}`,
      solution: blanked.solution,
    });
  }
  return out;
}

// --- Choose the better word ---------------------------------------------------------------------

export function betterWordQuestions(
  sets: readonly ConfusableSet[],
  random: () => number,
  count: number,
): ChoiceQuestion[] {
  const items = sets.flatMap((set) =>
    set.items.map((item, i) => ({ set, item, itemId: `${set.id}#${i}` })),
  );
  // At most one item per set, so a session doesn't ask about affect/effect twice.
  const seen = new Set<string>();
  const chosen = shuffle(items, random).filter(({ set }) => {
    if (seen.has(set.id)) return false;
    seen.add(set.id);
    return true;
  });
  return chosen.slice(0, count).map(({ set, item, itemId }) => {
    const answer = set.options.findIndex((o) => o.toLowerCase() === item.answer.toLowerCase());
    return {
      kind: 'choice',
      id: `better-word:${itemId}`,
      mode: 'better-word',
      itemId,
      instruction: 'Choose the better word',
      prompt: item.sentence,
      promptStyle: 'sentence',
      options: [...set.options],
      answer,
      explanation: item.explanation,
      solution: item.sentence.replace('___', set.options[answer]!),
    };
  });
}

// --- Upgrade this sentence ----------------------------------------------------------------------

export function upgradeQuestions(pool: readonly WordEntry[], count: number): WriteQuestion[] {
  return pool
    .filter((w) => w.upgrade)
    .slice(0, count)
    .map((word) => ({
      kind: 'write',
      id: `upgrade:${word.id}`,
      mode: 'upgrade',
      itemId: word.id,
      wordId: word.id,
      instruction: 'Upgrade this sentence',
      plain: word.upgrade!.plain,
      model: word.upgrade!.model,
      term: word.term,
      hint: word.definition,
    }));
}

// --- Register switch ----------------------------------------------------------------------------

const REGISTER_INSTRUCTIONS: Record<Register, string> = {
  formal: 'Say it more formally',
  neutral: 'Make it polite and professional',
  informal: 'Say it more casually',
};

export function registerQuestions(
  pairs: readonly RegisterPair[],
  random: () => number,
  count: number,
): ChoiceQuestion[] {
  return shuffle(pairs, random)
    .slice(0, count)
    .map((pair) => {
      const { options, answer } = arrange(
        pair.answer,
        pair.distractors.map((d) => d.text),
        random,
      );
      return {
        kind: 'choice',
        id: `register:${pair.id}`,
        mode: 'register',
        itemId: pair.id,
        instruction: REGISTER_INSTRUCTIONS[pair.toRegister],
        prompt: pair.from,
        promptStyle: 'sentence',
        context: pair.context,
        options,
        answer,
        why: options.map((o) => pair.distractors.find((d) => d.text === o)?.why),
        explanation: pair.explanation,
      };
    });
}
