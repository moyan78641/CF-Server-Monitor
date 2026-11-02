import test from 'node:test'
import assert from 'node:assert/strict'
import { filterServers, toggleVisibleSelection, reorderServers } from '../src/frontend/views/admin/serverFilters.js'

const servers = [
  { id: 'a', name: 'Tokyo Edge', region: 'jp', is_online: true, server_group: 'Asia', ip_v4: '192.0.2.1', ip_v6: '2001:db8::1' },
  { id: 'b', name: 'Frankfurt', region: 'DE', is_online: false, server_group: 'Europe', ip_v4: '198.51.100.5' },
  { id: 'c', name: 'Tokyo Backup', region: 'JP', is_online: false, server_group: 'Asia' },
]

test('name, IPv4 and IPv6 searches combine with region, state and group filters', () => {
  assert.deepEqual(filterServers(servers, { search: ' TOKYO ', region: 'JP', group: 'Asia', status: 'offline' }).map(s => s.id), ['c'])
  assert.deepEqual(filterServers(servers, { search: '2001:db8::1' }).map(s => s.id), ['a'])
  assert.deepEqual(filterServers(servers, { search: '198.51.100.5' }).map(s => s.id), ['b'])
  assert.deepEqual(filterServers(servers, { status: 'online', region: 'DE' }), [])
  assert.equal(filterServers(servers).length, 3)
})

test('selecting and deselecting filtered results preserves hidden selections', () => {
  assert.deepEqual(toggleVisibleSelection(['b'], ['a', 'c'], true), ['b', 'a', 'c'])
  assert.deepEqual(toggleVisibleSelection(['b', 'a', 'c'], ['a', 'c'], false), ['b'])
  assert.deepEqual(toggleVisibleSelection(['a'], ['a'], true), ['a'])
  assert.deepEqual(toggleVisibleSelection(['b'], [], false), ['b'])
})

test('dragging filtered rows preserves every node in the saved order', () => {
  assert.deepEqual(reorderServers(servers, 'c', 'a'), ['c', 'a', 'b'])
  assert.deepEqual(reorderServers(servers, 'a', 'c'), ['b', 'c', 'a'])
  assert.equal(reorderServers(servers, 'a', 'unknown'), null)
  assert.deepEqual(servers.map(s => s.id), ['a', 'b', 'c'])
})
