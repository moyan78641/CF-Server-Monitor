import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import { buildReplayStatusData } from '../src/frontend/utils/replayStatus.js'

test('replaying old samples preserves report liveness and chart time', async () => {
  const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
  try {
    const { isServerOnline } = await vite.ssrLoadModule('/src/frontend/utils/api.js')
    const now = Date.now()
    const sampleTs = now - 450_000
    const recent = buildReplayStatusData({ ts: sampleTs / 1000, reportTs: now, data: { cpu: 23 } })
    assert.equal(recent.cpu, 23)
    assert.equal(recent.sample_timestamp, sampleTs)
    assert.equal(recent.last_updated, now)
    assert.equal(isServerOnline(recent, now), true)
    const stale = buildReplayStatusData({ ts: sampleTs, reportTs: now - 600_000, data: { cpu: 23 } })
    assert.equal(isServerOnline(stale, now), false)
    assert.equal(stale.last_updated, now - 600_000)
    assert.equal(isServerOnline({ last_updated: null }, now), false)
    assert.equal(isServerOnline({}, now), false)
  } finally {
    await vite.close()
  }
})
