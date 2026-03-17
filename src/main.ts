import { convert, type ScoreResult } from './convert'

// --- Score type metadata ---
const SCORE_TYPES: Record<string, {
  key: keyof ScoreResult
  label: string
  description: string
  step: number
  decimals: number
  example: string
}> = {
  z:          { key: 'z',          label: 'z-Score',        description: 'Mean = 0, SD = 1',   step: 0.01, decimals: 2, example: '0.00' },
  t:          { key: 't',          label: 'T-Score',        description: 'Mean = 50, SD = 10',  step: 1,    decimals: 1, example: '50' },
  ss:         { key: 'ss',         label: 'Standard Score', description: 'Mean = 100, SD = 15', step: 1,    decimals: 1, example: '100' },
  scaled:     { key: 'scaled',     label: 'Scaled Score',   description: 'Mean = 10, SD = 3',   step: 1,    decimals: 1, example: '10' },
  percentile: { key: 'percentile', label: 'Percentile Rank',description: '0th – 100th',         step: 0.1,  decimals: 1, example: '50' },
}

const SCORE_KEYS = Object.keys(SCORE_TYPES)

// --- Classification based on standard score ---
function getClassification(ss: number): { label: string; color: string } {
  if (ss >= 130) return { label: 'Very Superior',  color: '#1a7a3a' }
  if (ss >= 120) return { label: 'Superior',       color: '#2d8f4e' }
  if (ss >= 110) return { label: 'High Average',   color: '#4a9e6b' }
  if (ss >= 90)  return { label: 'Average',        color: '#4a6fa5' }
  if (ss >= 80)  return { label: 'Low Average',    color: '#b8860b' }
  if (ss >= 70)  return { label: 'Borderline',     color: '#c45a2d' }
  return { label: 'Extremely Low', color: '#a33' }
}

// --- Bell curve rendering ---
function renderBellCurve(zScore: number) {
  const svg = document.getElementById('bell-svg')!
  const width = 360, height = 140, pad = 20

  const points: { x: number; y: number }[] = []
  for (let x = -3.5; x <= 3.5; x += 0.05) {
    const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
    points.push({ x, y })
  }
  const maxY = 0.4
  const toSvgX = (x: number) => pad + ((x + 3.5) / 7) * (width - 2 * pad)
  const toSvgY = (y: number) => height - pad - (y / maxY) * (height - 2 * pad)

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
    .join(' ')

  const clampedZ = Math.max(-3.5, Math.min(3.5, zScore))
  const shadedPoints = points.filter(p => p.x <= clampedZ)
  const shadedD =
    shadedPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
      .join(' ') +
    ` L${toSvgX(clampedZ).toFixed(1)},${toSvgY(0)} L${toSvgX(-3.5).toFixed(1)},${toSvgY(0)} Z`

  const markerX = toSvgX(clampedZ)
  const markerY = toSvgY(Math.exp(-0.5 * clampedZ * clampedZ) / Math.sqrt(2 * Math.PI))

  // SD tick labels
  const sdLabels = [-3, -2, -1, 0, 1, 2, 3].map(sd => {
    const x = toSvgX(sd)
    const baseY = toSvgY(0)
    return `
      <line x1="${x}" y1="${baseY - 3}" x2="${x}" y2="${baseY + 3}" stroke="#bbb" stroke-width="1"/>
      <text x="${x}" y="${baseY + 15}" text-anchor="middle" font-size="9" fill="#888" font-family="'DM Mono', monospace">
        ${sd > 0 ? '+' : ''}${sd}\u03C3
      </text>
    `
  }).join('')

  svg.innerHTML = `
    <defs>
      <linearGradient id="shadeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a6fa5" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#4a6fa5" stop-opacity="0.12"/>
      </linearGradient>
    </defs>
    <line x1="${pad}" y1="${toSvgY(0)}" x2="${width - pad}" y2="${toSvgY(0)}" stroke="#bbb" stroke-width="1"/>
    ${sdLabels}
    <path d="${shadedD}" fill="url(#shadeGrad)"/>
    <path d="${pathD}" fill="none" stroke="#4a6fa5" stroke-width="2"/>
    <circle cx="${markerX}" cy="${markerY}" r="4.5" fill="#c45a2d" stroke="#fff" stroke-width="1.5"/>
  `
}

// --- Results rendering ---
function renderResults(result: ScoreResult, inputType: string) {
  const list = document.getElementById('results-list')!
  list.innerHTML = SCORE_KEYS.map((key, i) => {
    const meta = SCORE_TYPES[key]
    const val = result[meta.key]
    const isInput = key === inputType
    const displayVal = key === 'percentile'
      ? `${val.toFixed(1)}%`
      : val.toFixed(meta.decimals)

    return `
      <div class="result-row${isInput ? ' is-input' : ''}" ${i < SCORE_KEYS.length - 1 ? '' : ''}>
        <div>
          <div class="result-label">
            ${meta.label}${isInput ? '<span class="input-tag">input</span>' : ''}
          </div>
          <div class="result-desc">${meta.description}</div>
        </div>
        <div class="result-value">${displayVal}</div>
      </div>
    `
  }).join('')
}

// --- DOM elements ---
const typeButtons = document.getElementById('type-buttons')!
const scoreInput = document.getElementById('score-input') as HTMLInputElement
const fieldHint = document.getElementById('field-hint')!
const errorEl = document.getElementById('error')!
const classificationWrap = document.getElementById('classification-wrap')!
const classificationBadge = document.getElementById('classification-badge')!
const bellCard = document.getElementById('bell-card')!
const resultsCard = document.getElementById('results-card')!
const footerNote = document.getElementById('footer-note')!

let currentType = 'z'

function showResults() {
  const sections = [classificationWrap, bellCard, resultsCard, footerNote]

  const val = parseFloat(scoreInput.value)
  if (isNaN(val)) {
    errorEl.textContent = 'Please enter a valid number.'
    errorEl.classList.remove('hidden')
    sections.forEach(el => el.classList.add('hidden'))
    return
  }

  if (currentType === 'percentile' && (val <= 0 || val >= 100)) {
    errorEl.textContent = 'Percentile must be between 0 and 100 (exclusive).'
    errorEl.classList.remove('hidden')
    sections.forEach(el => el.classList.add('hidden'))
    return
  }

  try {
    const result = convert(val, currentType)

    if (!isFinite(result.z)) {
      errorEl.textContent = 'Value out of convertible range.'
      errorEl.classList.remove('hidden')
      sections.forEach(el => el.classList.add('hidden'))
      return
    }

    errorEl.classList.add('hidden')

    // Classification
    const cls = getClassification(result.ss)
    classificationBadge.textContent = cls.label
    classificationBadge.style.background = cls.color + '18'
    classificationBadge.style.color = cls.color
    classificationBadge.style.border = `1px solid ${cls.color}33`

    // Bell curve
    renderBellCurve(result.z)

    // Results table
    renderResults(result, currentType)

    sections.forEach(el => el.classList.remove('hidden'))
  } catch (e: any) {
    errorEl.textContent = e.message
    errorEl.classList.remove('hidden')
    sections.forEach(el => el.classList.add('hidden'))
  }
}

function setActiveType(type: string) {
  currentType = type
  const meta = SCORE_TYPES[type]

  // Update button states
  typeButtons.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.type === type)
  })

  // Update hint and input
  fieldHint.textContent = `— ${meta.description}`
  scoreInput.step = String(meta.step)
  scoreInput.value = meta.example

  showResults()
}

// --- Event listeners ---
typeButtons.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.type-btn') as HTMLElement | null
  if (btn?.dataset.type) {
    setActiveType(btn.dataset.type)
  }
})

scoreInput.addEventListener('input', showResults)

// Initial render
showResults()
