# Adding words to WordWise

All built-in vocabulary lives in [`src/data/words.json`](../src/data/words.json). Each entry follows the `WordEntry` type in [`src/types/content.ts`](../src/types/content.ts), which documents every field.

## Quick start

1. Add an object to the array in `src/data/words.json` (anywhere; order doesn't matter).
2. Run `npm test`. The dataset test (`src/data/words.test.ts`) checks your entry and tells you exactly what's missing.
3. Run `npm run dev` and look the word up on the Browse screen.

## Template

```json
{
  "id": "succinct",
  "term": "succinct",
  "partOfSpeech": "adjective",
  "ipa": "/səkˈsɪŋkt/",
  "definition": "Expressed clearly in few words.",
  "examples": [
    {
      "role": "student",
      "text": "Keep your abstract succinct: 150 words, and every sentence should earn its place."
    },
    { "role": "teacher", "text": "Can someone give me a succinct definition of photosynthesis?" },
    { "role": "software", "text": "Her PR descriptions are always succinct." },
    { "role": "everyday", "text": "Keep the birthday card message succinct." }
  ],
  "register": "neutral",
  "collocations": ["a succinct summary", "put it succinctly"],
  "synonyms": [
    { "term": "concise", "note": "Very close; 'concise' stresses brevity, 'succinct' clarity too." }
  ],
  "antonyms": [
    { "term": "verbose" },
    { "term": "long-winded", "note": "Informal, and more critical." }
  ],
  "commonMistake": "Pronounced 'suk-SINKT', with a hard 'k'.",
  "origin": "Latin 'succinctus', girded up: clothing tucked in so nothing hangs loose.",
  "forms": ["succinctly", "succinctness"],
  "upgrade": {
    "plain": "Your report was short and clear.",
    "model": "Your report was admirably succinct."
  },
  "category": "general",
  "topics": ["writing", "communication"],
  "level": "upper-intermediate"
}
```

## Field guide

| Field           | Required | Notes                                                                                                                                                                                                              |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`            | yes      | Unique kebab-case slug. **Never change it after release**: review progress is stored against it.                                                                                                                   |
| `term`          | yes      | As displayed. For phrases with a variable part, use `something` / `someone` / `someone's`, e.g. `take something on board`.                                                                                         |
| `partOfSpeech`  | yes      | `noun`, `verb`, `adjective`, `adverb`, `conjunction`, `preposition`, `phrase`, `idiom`, `phrasal verb` or `collocation`.                                                                                           |
| `ipa`           | yes      | UK (RP) IPA between slashes, e.g. `/ˈnjuːɑːns/`.                                                                                                                                                                   |
| `definition`    | yes      | One plain-English sentence.                                                                                                                                                                                        |
| `examples`      | yes      | One example per role (`student`, `teacher`, `software`, `everyday`). Each must contain the term or one of its `forms`. Extra general examples are fine. All are shown on the word card, the learner's roles first. |
| `register`      | yes      | `formal`, `neutral` or `informal`.                                                                                                                                                                                 |
| `collocations`  | yes      | Words it naturally goes with.                                                                                                                                                                                      |
| `synonyms`      | yes      | Each has a `note` explaining how it differs; that note is the most useful bit.                                                                                                                                     |
| `antonyms`      | no       | Opposites, wherever a genuine one exists. `note` is optional: add one when the opposite is informal, critical or only fits one sense. Never list an opposite under `synonyms`.                                     |
| `otherMeanings` | no       | Other senses that could trip a learner up (see below). Each needs a `meaning` and an `example`; add a `cue` saying how to tell them apart.                                                                         |
| `commonMistake` | no       | A frequent misuse, mispronunciation or spelling trap.                                                                                                                                                              |
| `origin`        | no       | A short, memorable etymology. Hedge folk etymologies ("popularly said to…").                                                                                                                                       |
| `forms`         | no       | Inflections and variants (`corroborated`, `took something on board`). Used to spot the word in sentences.                                                                                                          |
| `upgrade`       | no       | For the "upgrade this sentence" practice mode. `plain` must **not** contain the term; `model` must.                                                                                                                |
| `category`      | yes      | `general`, `student`, `teaching`, `workplace`, `idiom` or `british`. Roles unlock `student`, `teaching` and `workplace`; the rest show for everyone.                                                               |
| `topics`        | yes      | Free tags used by search and filters, e.g. `meetings`, `feedback`, `data`.                                                                                                                                         |
| `level`         | yes      | `upper-intermediate`, `advanced` or `proficient`. Words at or below the learner's level are introduced first.                                                                                                      |

## Other meanings

Use `otherMeanings` when the same word or phrase means something genuinely different in another context or tone, and a learner might misread it. Examples: "pitch" (a football pitch), "robust" (a "robust exchange of views" is a row), "quite" ("quite good" is lukewarm, but "quite right" is "completely right").

```json
"otherMeanings": [
  {
    "meaning": "Surprisingly good, when said with enthusiasm.",
    "example": "Actually, that's quite good! I didn't expect to like it.",
    "cue": "Stress on 'good', a lively tone or an 'actually' all turn it into real praise."
  }
]
```

- The `cue` is the most valuable part: tell the learner how to spot which meaning is intended (tone, context, grammar, pronunciation).
- Skip it for senses that are obvious or already covered by the definition.
- Keep `commonMistake` for real misuse; a different meaning belongs here instead.

## Style rules

- **British English** throughout: spelling (colour, organise, prioritise), usage (revise, half-term, Year 9) and RP pronunciation. The test flags common American spellings.
- **Useful, not obscure**: would a fluent speaker actually use it this month in a meeting, essay or email?
- **Natural examples**: write sentences a real person would say, tailored to each role.
- **Kind, precise tone**: encouraging, never childish.

## How matching works

`src/lib/text.ts` recognises a term in a sentence by trying the `term` and each of its `forms`, ignoring case, curly versus straight apostrophes, and hyphen versus space. `something` / `someone` / `someone's` in a phrase match one to four words, so `take something on board` matches "I've taken _your comments_ on board" (via the form `taken something on board`). A leading "a", "an" or "the" is optional.

## Jokes and British sayings

- **Jokes** live in [`src/data/jokes.json`](../src/data/jokes.json) (`Joke` type): `setup`, `punchline`, and an `explanation` of the wordplay for learners. Add `roles` to show a joke mainly to those roles (e.g. a SQL joke for `software`). Keep them clean and kind.
- **British, decoded** lives in [`src/data/britishSayings.json`](../src/data/britishSayings.json) (`BritishSaying` type): what people `say`, what they usually `mean`, and an optional `note`. Many sayings sometimes mean exactly what they say: add `otherMeanings` with a `meaning` and a `cue` (required for sayings) explaining how to tell, e.g. "If a date follows, it's real".

`npm test` checks both files too.

## Practice content

Two practice modes have their own content files. `npm test` checks both (`src/data/practice.test.ts`).

- **Choose the better word** lives in [`src/data/confusables.json`](../src/data/confusables.json) (`ConfusableSet` type). Each set lists easily confused `options` (e.g. `["practice", "practise"]`). Each item has a `sentence` with exactly one `___`, the `answer` (one of the options) and an `explanation` the learner sees afterwards. British distinctions (practice/practise, licence/license, dependant/dependent) are especially welcome.
- **Register switch** lives in [`src/data/registerPairs.json`](../src/data/registerPairs.json) (`RegisterPair` type). Each item gives a `context` ("Email to a client"), the phrase to change (`from`, `fromRegister`), the target register (`toRegister`), the best `answer`, and exactly three `distractors`, each with a `why`. Good distractors are tempting: too casual, too stiff (over-formal is a mistake too), or a British phrase with a different meaning ("gutted" isn't "tired"). Include some that go from formal to informal.
