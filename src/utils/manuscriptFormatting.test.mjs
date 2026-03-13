import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ensureManuscriptRichHtml,
  sanitizeManuscriptHtml,
  stripModelArtifacts,
} from './manuscriptFormatting.mjs'

const markdownLikeToHtml = (value) => {
  const normalized = String(value || '').trim()
  return normalized ? `<p>${normalized}</p>` : '<p></p>'
}

test('stripModelArtifacts recovers broken JSON wrappers', () => {
  const raw = 'assistant: {"text":"<h2>Introduction</h2><p>Grace restores us.</p>'

  assert.equal(stripModelArtifacts(raw), '<h2>Introduction</h2><p>Grace restores us.</p>')
})

test('ensureManuscriptRichHtml converts legacy plain text into HTML', () => {
  const raw = 'Introduction\nGrace restores us.'

  assert.equal(ensureManuscriptRichHtml(raw, markdownLikeToHtml), '<p>Introduction\nGrace restores us.</p>')
})

test('sanitizeManuscriptHtml preserves good HTML and removes hostile markup', () => {
  const raw = '<h2>Introduction</h2><p onclick="alert(1)">Grace restores us.</p><script>alert(1)</script>'

  assert.equal(sanitizeManuscriptHtml(raw), '<h2>Introduction</h2><p>Grace restores us.</p>')
})
