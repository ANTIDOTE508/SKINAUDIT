import { RELATION_GRAPH_SVG } from './relationGraphMarkup'

/**
 * Step 04 backdrop: the relationship graph — edges lighting up across a
 * network of nodes, the audit surfacing how parts relate.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML. `.gr-hot`
 * / `.gr-node` ambient animation lives in how-it-works.css.
 */
export function RelationGraphArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: RELATION_GRAPH_SVG }}
    />
  )
}
