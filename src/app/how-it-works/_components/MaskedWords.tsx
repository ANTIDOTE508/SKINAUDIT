import { Fragment } from 'react'

/**
 * Splits a phrase into the comp's masked word-reveal markup: each word in
 * an overflow-hidden `.w` wrapper with an inner `.wi` span, so words rise
 * out from behind an edge (see the `.w` / `.wi` rules in how-it-works.css).
 *
 * The inter-word space is a plain text node *between* the `.w` wrappers,
 * never inside one — `.w` is `overflow: hidden`, so a space placed within
 * it would be clipped and the words would run together.
 *
 * Server-safe — plain markup, no client JS. The rise itself is played by
 * <HowItWorksMotion />; at rest the words render normally.
 */
export function MaskedWords({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="w">
            <span className="wi">{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}
