import { onBeforeUnmount, onMounted } from 'vue'

// Existing dialogs retain their business logic; keyboard and focus behavior is shared.
export function useDialogs(rootSelector = '.admin-app') {
  let observer
  let topDialog
  let nextId = 0
  const returnFocus = new WeakMap()
  const focusable = (dialog) => [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length)
  const update = () => {
    const dialogs = [...document.querySelectorAll(`${rootSelector} .modal-overlay.active`)]
    const next = dialogs.at(-1)
    document.body.classList.toggle('ui-dialog-open', Boolean(next))
    for (const [index, overlay] of dialogs.entries()) {
      overlay.style.zIndex = String(100 + index)
      const dialog = overlay.querySelector('.modal-dialog')
      if (!dialog) continue
      dialog.setAttribute('role', 'dialog')
      dialog.setAttribute('aria-modal', 'true')
      dialog.setAttribute('tabindex', '-1')
      const title = dialog.querySelector('.modal-title')
      if (title) {
        if (!title.id) title.id = `admin-dialog-title-${++nextId}`
        dialog.setAttribute('aria-labelledby', title.id)
      }
    }
    if (next === topDialog) return
    const previous = topDialog
    topDialog = next
    if (next && !returnFocus.has(next)) returnFocus.set(next, document.activeElement)
    if (previous && !dialogs.includes(previous)) {
      const trigger = returnFocus.get(previous)
      returnFocus.delete(previous)
      if (trigger?.isConnected && (!next || next.contains(trigger))) trigger.focus({ preventScroll: true })
    }
    if (next && !next.contains(document.activeElement)) {
      const dialog = next.querySelector('.modal-dialog')
      dialog?.focus({ preventScroll: true })
    }
  }
  const onKeydown = (event) => {
    if (!topDialog) return
    // A portalled select owns its keyboard interaction until it closes.
    if (document.querySelector('.ui-select-menu[data-state="open"]')) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      topDialog.querySelector('.modal-close:not(:disabled)')?.click()
    }
    if (event.key !== 'Tab') return
    const dialog = topDialog.querySelector('.modal-dialog')
    const items = dialog ? focusable(dialog) : []
    const first = items[0]
    const last = items.at(-1)
    if (!first) { event.preventDefault(); dialog?.focus(); return }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus() }
  }
  onMounted(() => {
    observer = new MutationObserver(update)
    const root = document.querySelector(rootSelector)
    if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    document.addEventListener('keydown', onKeydown, true)
    update()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.removeEventListener('keydown', onKeydown, true)
    document.body.classList.remove('ui-dialog-open')
  })
}
