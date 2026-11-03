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

| Field           | Required | Notes                                                                                                                                                   |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | yes      | Unique kebab-case slug. **Never change it after release**: review progress is stored against it.                                                        |
| `term`          | yes      | As displayed. For phrases with a variable part, use `something` / `someone` / `someone's`, e.g. `take something on board`.                              |
| `partOfSpeech`  | yes      | `noun`, `verb`, `adjective`, `adverb`, `conjunction`, `phrase`, `idiom`, `phrasal verb` or `collocation`.                                               |
| `ipa`           | yes      | UK (RP) IPA between slashes, e.g. `/ˈnjuːɑːns/`.                                                                                                        |
| `definition`    | yes      | One plain-English sentence.                                                                                                                             |
| `examples`      | yes      | One example per role (`student`, `teacher`, `software`, `everyday`). Each must contain the term or one of its `forms`. Extra general examples are fine. |
| `register`      | yes      | `formal`, `neutral` or `informal`.                                                                                                                      |
| `collocations`  | yes      | Words it naturally goes with.                                                                                                                           |
| `synonyms`      | yes      | Each has a `note` explaining how it differs; that note is the most useful bit.                                                                          |
| `commonMistake` | no       | A frequent misuse, mispronunciation or spelling trap.                                                                                                   |
| `origin`        | no       | A short, memorable etymology. Hedge folk etymologies ("popularly said to…").                                                                            |
| `forms`         | no       | Inflections and variants (`corroborated`, `took something on board`). Used to spot the word in sentences.                                               |
| `upgrade`       | no       | For the "upgrade this sentence" practice mode. `plain` must **not** contain the term; `model` must.                                                     |
| `category`      | yes      | `general`, `student`, `teaching`, `workplace`, `idiom` or `british`. Roles unlock `student`, `teaching` and `workplace`; the rest show for everyone.    |
| `topics`        | yes      | Free tags used by search and filters, e.g. `meetings`, `feedback`, `data`.                                                                              |
| `level`         | yes      | `upper-intermediate`, `advanced` or `proficient`. Words at or below the learner's level are introduced first.                                           |

## Style rules

- **British English** throughout: spelling (colour, organise, prioritise), usage (revise, half-term, Year 9) and RP pronunciation. The test flags common American spellings.
- **Useful, not obscure**: would a fluent speaker actually use it this month in a meeting, essay or email?
- **Natural examples**: write sentences a real person would say, tailored to each role.
- **Kind, precise tone**: encouraging, never childish.

## How matching works

`src/lib/text.ts` recognises a term in a sentence by trying the `term` and each of its `forms`, ignoring case, curly versus straight apostrophes, and hyphen versus space. `something` / `someone` / `someone's` in a phrase match one to four words, so `take something on board` matches "I've taken _your comments_ on board" (via the form `taken something on board`). A leading "a", "an" or "the" is optional.

## Jokes and British sayings

- **Jokes** live in [`src/data/jokes.json`](../src/data/jokes.json) (`Joke` type): `setup`, `punchline`, and an `explanation` of the wordplay for learners. Add `roles` to show a joke mainly to those roles (e.g. a SQL joke for `software`). Keep them clean and kind.
- **British, decoded** lives in [`src/data/britishSayings.json`](../src/data/britishSayings.json) (`BritishSaying` type): what people `say`, what they usually `mean`, and an optional `note`.

`npm test` checks both files too.
