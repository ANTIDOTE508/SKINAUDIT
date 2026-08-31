const PRINCIPLES = [
  {
    num: '01',
    name: 'Relationships over ingredients',
    desc: 'An ingredient tells you something. Its relationship to everything around it tells you more.',
  },
  {
    num: '02',
    name: 'Context over absolutes',
    desc: 'There are very few universally “good” or “bad” skincare decisions. Frequency, tolerance, environment, treatments and the rest of the regimen matter.',
  },
  {
    num: '03',
    name: 'Observation over assumption',
    desc: 'SkinAudit helps you record what changes instead of forcing every experience into a predefined skin-type label.',
  },
  {
    num: '04',
    name: 'Intelligence over instruction',
    desc: 'The goal is not to tell you what your skin should do. It is to make the information surrounding your decisions easier to understand.',
  },
]

/** No art here — the quiet middle between two loud moments. */
export function ApproachSection() {
  return (
    <div className="section sec-approach">
      <div className="inner">
        <p className="label">Our Approach</p>

        <div className="principles">
          {PRINCIPLES.map(({ num, name, desc }) => (
            <div className="principle" key={num}>
              <span className="p-num">{num}</span>
              <h3 className="p-name">{name}</h3>
              <p className="p-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
