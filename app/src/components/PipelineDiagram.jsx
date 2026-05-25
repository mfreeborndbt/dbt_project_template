export default function PipelineDiagram({ sources, stages, audiences }) {
  const padding = 20
  const headerH = 24
  const nodeW = 140
  const nodeH = 34
  const nodeGapY = 12
  const colGap = 40

  const midIdx = Math.ceil(stages.length / 2)
  const col1Stages = stages.slice(0, midIdx)
  const col2Stages = stages.slice(midIdx)
  const hasTwoCols = col2Stages.length > 0

  const numCols = hasTwoCols ? 4 : 3
  const svgWidth = padding * 2 + numCols * nodeW + (numCols - 1) * colGap

  const colX = []
  for (let i = 0; i < numCols; i++) {
    colX.push(padding + i * (nodeW + colGap))
  }

  const maxNodes = Math.max(sources.length, col1Stages.length, col2Stages.length || 0, audiences.length)
  const contentH = maxNodes * (nodeH + nodeGapY) - nodeGapY
  const svgHeight = padding * 2 + headerH + contentH + 10

  function layoutCol(items, x) {
    const totalH = items.length * (nodeH + nodeGapY) - nodeGapY
    const startY = padding + headerH + (contentH - totalH) / 2
    return items.map((item, i) => ({
      ...item,
      x,
      y: startY + i * (nodeH + nodeGapY),
    }))
  }

  const srcNodes = layoutCol(
    sources.map((s, i) => ({ id: `src_${i}`, label: s.replace(' Data', ''), color: '#ff694a' })),
    colX[0]
  )
  const col1Nodes = layoutCol(col1Stages, colX[1])
  const col2Nodes = hasTwoCols ? layoutCol(col2Stages, colX[2]) : []
  const audNodes = layoutCol(
    audiences.map((a, i) => ({ id: `aud_${i}`, label: a.replace(' Audiences', '').replace(' Lists', '').replace(' Views', ''), color: '#22c55e' })),
    colX[numCols - 1]
  )

  const edges = []
  srcNodes.forEach(src => {
    col1Nodes.forEach(st => {
      edges.push({ x1: src.x + nodeW, y1: src.y + nodeH / 2, x2: st.x, y2: st.y + nodeH / 2 })
    })
  })
  if (hasTwoCols) {
    col1Nodes.forEach(st1 => {
      col2Nodes.forEach(st2 => {
        edges.push({ x1: st1.x + nodeW, y1: st1.y + nodeH / 2, x2: st2.x, y2: st2.y + nodeH / 2 })
      })
    })
  }
  const lastCol = hasTwoCols ? col2Nodes : col1Nodes
  lastCol.forEach(st => {
    audNodes.forEach(aud => {
      edges.push({ x1: st.x + nodeW, y1: st.y + nodeH / 2, x2: aud.x, y2: aud.y + nodeH / 2 })
    })
  })

  const renderNode = (node, delay) => (
    <g key={node.id} className="fade-in" style={{ animationDelay: `${delay}ms` }}>
      <rect x={node.x} y={node.y} width={nodeW} height={nodeH} rx={8}
        fill={node.color + '18'} stroke={node.color} strokeWidth={1.5} />
      <text x={node.x + nodeW / 2} y={node.y + nodeH / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={node.color} fontSize={11} fontWeight={500} fontFamily="Inter, sans-serif">
        {node.label.length > 16 ? node.label.slice(0, 14) + '...' : node.label}
      </text>
    </g>
  )

  const headers = [
    { x: colX[0] + nodeW / 2, label: 'Sources' },
    { x: colX[1] + nodeW / 2, label: 'Resolution' },
  ]
  if (hasTwoCols) {
    headers.push({ x: colX[2] + nodeW / 2, label: 'Processing' })
  }
  headers.push({ x: colX[numCols - 1] + nodeW / 2, label: 'Marts' })

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'hidden', display: 'block' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
          markerWidth={6} markerHeight={5} orient="auto-start-reverse">
          <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#30363d" />
        </marker>
      </defs>

      {headers.map(h => (
        <text key={h.label} x={h.x} y={padding + 10} textAnchor="middle"
          fill="#8b949e" fontSize={10} fontWeight={600} fontFamily="Inter, sans-serif"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h.label}</text>
      ))}

      {edges.map((e, i) => {
        const midX = (e.x1 + e.x2) / 2
        return (
          <path key={`edge_${i}`}
            d={`M ${e.x1} ${e.y1} C ${midX} ${e.y1}, ${midX} ${e.y2}, ${e.x2} ${e.y2}`}
            fill="none" stroke="#30363d" strokeWidth={1}
            className="draw-line"
            style={{ animationDelay: `${200 + i * 30}ms` }}
            markerEnd="url(#arrow)" />
        )
      })}

      {srcNodes.map((n, i) => renderNode(n, i * 60))}
      {col1Nodes.map((n, i) => renderNode(n, 150 + i * 60))}
      {col2Nodes.map((n, i) => renderNode(n, 300 + i * 60))}
      {audNodes.map((n, i) => renderNode(n, 400 + i * 60))}
    </svg>
  )
}
