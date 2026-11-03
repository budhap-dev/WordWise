/** Question shapes shared by every practice mode. Generators are pure; the UI renders these. */

export type PracticeMode = 'meaning' | 'gap-fill' | 'better-word' | 'upgrade' | 'register';

/** A session can be one mode, or a mixed bag of all of them. */
export type SessionMode = PracticeMode | 'mixed';

interface QuestionBase {
  /** Unique within a session, e.g. "meaning:nuance". */
  id: string;
  mode: PracticeMode;
  /** The underlying content: a word id, a confusable item ("affect-effect#0") or a register pair id. */
  itemId: string;
  /** The word being practised, when there is one. */
  wordId?: string;
  /** What to do, e.g. "What does it mean?" */
  instruction: string;
}

/** Tap one answer. Used by every mode except "upgrade". */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  /** The term, phrase or sentence (with "___" for gap fill and better word). */
  prompt: string;
  /** How to show the prompt: a headword, or a sentence/phrase. */
  promptStyle: 'term' | 'sentence';
  /** Where it's said, e.g. "Email to a client" (register switch). */
  context?: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Why each wrong option is wrong, by option index, when we know (register switch). */
  why?: (string | undefined)[];
  /** Shown after answering. */
  explanation: string;
  /** The full sentence with the gap filled, shown after answering. */
  solution?: string;
}

/** Rewrite a sentence using the target word. Checked for the term; compared with a model answer. */
export interface WriteQuestion extends QuestionBase {
  kind: 'write';
  mode: 'upgrade';
  wordId: string;
  plain: string;
  model: string;
  term: string;
  /** The word's definition, as a hint. */
  hint: string;
}

export type Question = ChoiceQuestion | WriteQuestion;
