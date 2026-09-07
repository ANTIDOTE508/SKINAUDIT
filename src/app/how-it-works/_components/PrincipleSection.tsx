import { PrincipleResolveArt } from './art/PrincipleResolveArt'
import { MaskedWords } from './MaskedWords'

export function PrincipleSection() {
  return (
    <div className="section sec-principle">
      <PrincipleResolveArt />
      <div className="art-veil" />
      <div className="inner">
        <p className="label">The Principle</p>
        <h2 className="pr-hed">
          <MaskedWords text="Clarity you can act on." />
        </h2>
        <div className="pr-body">
          <p>
            SkinAudit turns the complexity of your regimen into guidance you can actually use.
            Understand what is working together, what may deserve reconsideration, and where there
            may be room for something different.
          </p>
          <p>
            So when your routine needs to change, you&apos;re not left guessing what to keep, what
            to adjust, or what to consider next.
          </p>
          <p className="close">
            A routine that makes more sense — and guidance for where to go next.
          </p>
        </div>
      </div>
    </div>
  )
}
