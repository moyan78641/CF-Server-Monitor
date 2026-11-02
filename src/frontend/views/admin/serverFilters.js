export function filterServers(servers, { search = '', status = '', region = '', group = '', defaultGroup = 'Default' } = {}) {
  const query = search.trim().toLocaleLowerCase()
  return servers.filter(server => (
    (!query || [server.name, server.ip_v4, server.ip_v6].some(value => String(value || '').toLocaleLowerCase().includes(query))) &&
    (!status || Boolean(server.is_online) === (status === 'online')) &&
    (!region || String(server.region || 'xx').toUpperCase() === region.toUpperCase()) &&
    (!group || String(server.server_group || defaultGroup) === group)
  ))
}

// Filtering changes the visible rows, not the order or selection of hidden nodes.
export function toggleVisibleSelection(selected, visibleIds, checked) {
  const visible = new Set(visibleIds)
  return checked ? [...new Set([...selected, ...visibleIds])] : selected.filter(id => !visible.has(id))
}

export function reorderServers(servers, sourceId, targetId) {
  const ids = servers.map(server => String(server.id))
  const sourceIndex = ids.indexOf(String(sourceId))
  const targetIndex = ids.indexOf(String(targetId))
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return null
  const [source] = ids.splice(sourceIndex, 1)
  ids.splice(targetIndex, 0, source)
  return ids
}
