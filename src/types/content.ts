/**
 * Content types for WordWise's built-in (seed) data.
 *
 * Every user-facing string is British English (spelling, usage, pronunciation).
 * See docs/ADDING_WORDS.md for a walkthrough of adding new entries.
 */

/**
 * The roles a learner can pick during onboarding. `everyday` is the generic role:
 * friends, family, shops, appointments and social plans.
 */
export type Role = 'student' | 'teacher' | 'software' | 'everyday';

/**
 * Which group a word belongs to. `general`, `idiom` and `british` are shown to everyone;
 * the others are unlocked by the matching role (see ROLE_CATEGORY in src/data).
 */
export type Category = 'general' | 'student' | 'teaching' | 'workplace' | 'idiom' | 'british';

export type Register = 'formal' | 'neutral' | 'informal';

/** Self-assessed level. Words tagged with a level are shown at that level and above. */
export type Level = 'upper-intermediate' | 'advanced' | 'proficient';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'idiom'
  | 'phrasal verb'
  | 'collocation'
  | 'conjunction';

export interface Example {
  /** A natural sentence using the term. */
  text: string;
  /** Who the sentence is written for. Omit for a general-purpose example. */
  role?: Role;
}

export interface Synonym {
  term: string;
  /** How it differs from the headword, e.g. "terse: shorter, and can sound curt". */
  note: string;
}

/** An "upgrade this sentence" prompt: a plain sentence and a model rewrite using the term. */
export interface UpgradePrompt {
  plain: string;
  model: string;
}

/**
 * Another way the same word or phrase is used: a different sense, or the opposite reading in a
 * different tone (e.g. "quite good" is usually lukewarm, but said with enthusiasm it's praise).
 */
export interface OtherMeaning {
  /** The other meaning, one short sentence. */
  meaning: string;
  /** A sentence showing this sense in use. Required for words; optional for sayings. */
  example?: string;
  /** How to tell which meaning is intended: tone, context or grammar. Required for sayings. */
  cue?: string;
}

export interface WordEntry {
  /** Stable kebab-case slug, unique across all words. Never change it once shipped: progress is keyed on it. */
  id: string;
  /** The word or phrase as it should be displayed, e.g. "touch base". */
  term: string;
  partOfSpeech: PartOfSpeech;
  /** UK (Received Pronunciation) IPA, with slashes, e.g. "/tʌtʃ ˈbeɪs/". */
  ipa: string;
  /** A plain-English definition, one sentence. */
  definition: string;
  /**
   * Example sentences. Seed entries have one per role (student, teacher, software),
   * and may add general ones.
   */
  examples: Example[];
  register: Register;
  /** Words it commonly goes with, e.g. ["a subtle nuance", "nuances of meaning"]. */
  collocations: string[];
  synonyms: Synonym[];
  /** Other senses that could trip a learner up, e.g. "pitch" as a football pitch. */
  otherMeanings?: OtherMeaning[];
  /** A short tip about a frequent misuse, where relevant. */
  commonMistake?: string;
  /** A one- or two-line origin story (etymology), to make the word stick. */
  origin?: string;
  /**
   * Inflected or variant forms, used to recognise the term in sentences
   * (gap-fill, "upgrade this sentence"), e.g. ["corroborates", "corroborated", "corroborating"].
   */
  forms?: string[];
  upgrade?: UpgradePrompt;
  category: Category;
  /** Free-form tags used for search and filtering, e.g. ["meetings", "feedback"]. */
  topics: string[];
  level: Level;
}

/** Situations for the Everyday Phrases section. */
export type Situation =
  | 'small-talk'
  | 'meetings'
  | 'disagreeing'
  | 'feedback'
  | 'asking-for-help'
  | 'email-openings'
  | 'email-sign-offs'
  | 'phone-calls';

export interface Phrase {
  id: string;
  text: string;
  situation: Situation;
  register: Register;
  /** When and how to use it. */
  usage: string;
  example?: string;
}

/** A set of easily confused words for "choose the better word". */
export interface ConfusableSet {
  id: string;
  /** The words being contrasted, e.g. ["affect", "effect"]. */
  options: string[];
  items: {
    /** A sentence with "___" where the answer goes. */
    sentence: string;
    /** Must be one of `options` (case-insensitive). */
    answer: string;
    explanation: string;
  }[];
}

/** An informal ↔ formal pair for the register-switch practice mode. */
export interface RegisterPair {
  id: string;
  informal: string;
  /** One or more acceptable formal equivalents; the first is the model answer. */
  formal: string[];
  context?: string;
}

/** A clean, groan-worthy joke. The explanation unpacks the wordplay for learners. */
export interface Joke {
  id: string;
  setup: string;
  punchline: string;
  explanation: string;
  /** Shown more often to these roles. Omit for everyone. */
  roles?: Role[];
}

/** British understatement decoded: what people say, and what they usually mean. Tongue in cheek. */
export interface BritishSaying {
  id: string;
  say: string;
  mean: string;
  note?: string;
  /** When it means something else, often exactly what it says, and how to tell. */
  otherMeanings?: OtherMeaning[];
}
