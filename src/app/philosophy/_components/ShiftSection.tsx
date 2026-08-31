import { ShiftFlowArt } from './art/ShiftFlowArt'

export function ShiftSection() {
  return (
    <div className="section sec-shift">
      <ShiftFlowArt />
      <div className="art-veil" />
      <div className="inner">
        <p className="label">The Shift</p>

        <h2 className="shift-hed">
          <span className="from">From product literacy</span>
          <span className="to">to regimen literacy.</span>
        </h2>

        <div className="shift-body">
          <p className="beat">
            For years, skincare education has taught us to recognize ingredients, concentrations,
            claims and categories.
          </p>
          <p className="beat hold">That knowledge still matters.</p>
          <p className="beat">
            But knowing what is inside a bottle is different from understanding what happens when
            that bottle becomes part of a routine.
          </p>
          <p className="beat last">SkinAudit is designed for the second question.</p>
        </div>
      </div>
    </div>
  )
}
