<script>
import { defineComponent, h, Fragment, ref, onMounted, onUpdated, useId } from 'vue'
import { SelectRoot, SelectTrigger, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui'
import { Check, ChevronDown } from 'lucide-vue-next'
import '../styles/select.css'

// Keep existing option values and change handlers while replacing the visible
// browser menu with Reka's accessible, collision-aware listbox.
const textOf = (children) => Array.isArray(children) ? children.map(node => typeof node === 'object' ? textOf(node.children) : String(node ?? '')).join('') : String(children ?? '')
const readOptions = (nodes, disabled = false) => nodes.flatMap(node => {
  if (!node || typeof node !== 'object') return []
  if (node.type === Fragment || node.type === 'optgroup') return readOptions(node.children || [], disabled || Boolean(node.props?.disabled))
  if (node.type !== 'option') return []
  const label = textOf(node.children).trim()
  const value = node.props && 'value' in node.props ? node.props.value : label
  return [{ value, label, token: `option:${String(value)}`, disabled: disabled || Boolean(node.props?.disabled === '' || node.props?.disabled) }]
})

export default defineComponent({
  inheritAttrs: false,
  props: {
    modelValue: { default: undefined },
    value: { default: undefined },
    disabled: Boolean,
    modelModifiers: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { attrs, slots, emit, expose }) {
    const trigger = ref(null)
    const labelId = `select-label-${useId()}`
    const associateLabel = () => {
      const button = trigger.value?.$el
      if (!button || attrs['aria-label'] || attrs['aria-labelledby']) return
      const group = button.closest('.form-group, .batch-edit-field')
      const label = group?.querySelector('.form-label, .batch-edit-field-toggle > span')
      if (!label) return
      if (!label.id) label.id = labelId
      button.setAttribute('aria-labelledby', label.id)
    }
    onMounted(associateLabel)
    onUpdated(associateLabel)
    expose({ focus: () => trigger.value?.$el?.focus() })
    return () => {
      const options = readOptions(slots.default?.() || [])
      const raw = props.modelValue !== undefined ? props.modelValue : props.value
      const selected = options.find(option => String(option.value) === String(raw))
      const choose = (token) => {
        const option = options.find(item => item.token === token)
        if (!option) return
        const value = props.modelModifiers.number ? Number(option.value) : option.value
        emit('update:modelValue', value)
        emit('change', { target: { value } })
      }
      return h(SelectRoot, { modelValue: selected?.token || '', disabled: props.disabled, 'onUpdate:modelValue': choose }, {
        default: () => [
          h(SelectTrigger, { ...attrs, ref: trigger, type: 'button', class: ['ui-select-trigger', attrs.class], 'aria-label': attrs['aria-label'] }, {
            default: () => [h('span', { class: 'ui-select-value' }, selected?.label || String(raw ?? '')), h(ChevronDown, { size: 14, class: 'ui-select-chevron', 'aria-hidden': true })],
          }),
          h(SelectPortal, {}, { default: () => h(SelectContent, { class: 'ui-select-menu', position: 'popper', sideOffset: 6, collisionPadding: 12, bodyLock: false, loop: true }, {
            default: () => h(SelectViewport, { class: 'ui-select-viewport' }, {
              default: () => options.map(option => h(SelectItem, { key: option.token, value: option.token, disabled: option.disabled, textValue: option.label, class: 'ui-select-option' }, {
                default: () => [h(SelectItemText, {}, { default: () => option.label }), h(SelectItemIndicator, { class: 'ui-select-check' }, { default: () => h(Check, { size: 15, 'aria-hidden': true }) })],
              })),
            }),
          }) }),
        ],
      })
    }
  },
})
</script>
