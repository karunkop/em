import { beforeAll, expect, it } from 'vitest'
import generateEmoji from '../prompts/generateEmoji'

/**
 * The must-have concepts for each category. Each string is one concept with its acceptable variants, and every concept
 * must be represented in the generated top five. Curated from the model's own output on the sample run in #5085 rather
 * than from a single model run of the prompt, so that a miss means the ranking changed and not that the fixture picked
 * one variant over another. Events is spelled Party because the model reads it as a celebration; Irritable is omitted
 * because the model's top five for it were the faces the prompt's avoid list forbids, which is a prompt finding rather
 * than an eval fixture.
 */
const semanticCases: Record<string, string[]> = {
  Art: ['🎨', '🖼️', '🖌️🖍️🖋️'],
  Blank: ['⬜◻️◽▫️', '🔲🔳📄⚪⚫'],
  Books: ['📚', '📖', '📘📕📗📙📔📒📓'],
  Cosmos: ['🌌', '🪐⭐🌟🌠☄️', '🌍🌎🌏🌙'],
  Discourse: ['💬🗨️', '🗣️📣📢'],
  Dog: ['🐕🐶', '🦮🐕‍🦺🐩🐾🦴'],
  Email: ['📧✉️', '📨📩📬📫📪📭📥📤💌'],
  Film: ['🎬', '🎥📽️🎞️📹', '🍿'],
  Finance: ['💰💵💸🪙💲', '🏦💳📈💹'],
  Food: ['🍎🍞🍚🥖🍽️🍴', '🍕🍔🍝🍲🥘🍣🌮🥗🍜🍟'],
  Health: ['🩺⚕️🏥', '💊💉🩹'],
  Home: ['🏠🏡', '🏘️🛋️🛏️🚪🔑🪑'],
  Mind: ['🧠', '💭💡🧩'],
  Party: ['🎉🎊', '🎈🎂🎁'],
  Peace: ['☮️🕊️', '🌿🫒🪷🤝🌈'],
  Question: ['❓❔⁉️', '🤔🧐🔍💭'],
  Work: ['🛠️🔨🔧⚒️🧰⚙️', '💼👷🏭🧱'],
}

/** How many of the ten generated emoji count as the top of the ranking. */
const TOP_N = 5

/** Independent generations per category. The criterion must hold in a majority, so a single nondeterministic miss does not fail the category and a single lucky hit does not pass it. */
const SAMPLES = 3

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })

/** Removes presentation selectors so equivalent text and emoji forms compare equally. */
const normalizeEmoji = (value: string): string => value.replace(/️/g, '')

/** Splits a string of emoji into its normalized graphemes. */
const graphemes = (value: string): string[] =>
  Array.from(segmenter.segment(value), part => normalizeEmoji(part.segment))

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY_GENERATE_EMOJI && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY_GENERATE_EMOJI or OPENAI_API_KEY is required')
  }
})

it.concurrent.each(Object.entries(semanticCases))(
  '%s ranks every must-have concept in the top five in most samples',
  // The eval project retries failures twice, which would pass a category on any one of three attempts. Sampling
  // replaces that here: the majority criterion is the tolerance for nondeterminism.
  { retry: 0 },
  async (category, concepts) => {
    const samples: string[][] = []
    for (let i = 0; i < SAMPLES; i++) {
      const [actual] = await generateEmoji([category])
      samples.push(actual.map(normalizeEmoji))
    }

    /** Whether every must-have concept has a variant in the sample's top five. */
    const satisfies = (sample: string[]): boolean =>
      concepts.every(concept => graphemes(concept).some(emoji => sample.slice(0, TOP_N).includes(emoji)))

    const passes = samples.filter(satisfies).length
    const report = samples
      .map(sample => `${satisfies(sample) ? '✅' : '❌'} ${sample.slice(0, TOP_N).join(' ')} | ${sample.slice(TOP_N).join(' ')}`)
      .join('\n')

    // An assertion message is shown only on failure, and the generated lists are what a fixture is tuned against, so
    // log them for passing categories too.
    console.info(`${category} (${passes}/${SAMPLES})\n${report}`)

    expect(passes, `Must-have: ${concepts.join('  ')}\n${report}`).toBeGreaterThan(SAMPLES / 2)
  },
)
