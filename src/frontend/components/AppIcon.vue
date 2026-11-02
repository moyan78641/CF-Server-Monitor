<template>
  <component :is="icons[name] || icons.server" :size="size" :stroke-width="1.7" aria-hidden="true" class="admin-icon ui-icon" />
</template>

<script setup>
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowUpRight, Bell, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleHelp, CircleX, Cloud,
  Code, Copy, Database, Download, Eye, EyeOff, Globe, GripVertical, Heart, Image,
  LayoutDashboard, LoaderCircle, LogOut, Menu, Monitor, Moon, Palette, Pencil,
  Plus, RefreshCw, Search, Server, Settings, Shield, Sun, Terminal, Trash2,
  Upload, UserRound, X, Zap, Cpu, MemoryStick, HardDrive, Network, Circle,
  ChevronsUpDown, Save, ExternalLink, RotateCcw, SlidersHorizontal, Link,
  LayoutGrid, List, Map, Wallet, CalendarDays, Clock, ArrowDown, ArrowUp, Layers, CircleGauge,
} from 'lucide-vue-next'

defineProps({ name: { type: String, default: 'server' }, size: { type: Number, default: 18 } })
const icons = {
  activity: Activity, download: Download, 'arrow-left': ArrowLeft, 'arrow-up-right': ArrowUpRight,
  bell: Bell, check: Check, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, alert: CircleAlert, success: CircleCheck, help: CircleHelp,
  error: CircleX, cloud: Cloud, code: Code, copy: Copy, database: Database,
  eye: Eye, 'eye-off': EyeOff, globe: Globe, grip: GripVertical, heart: Heart, image: Image,
  dashboard: LayoutDashboard, loader: LoaderCircle, logout: LogOut, menu: Menu,
  monitor: Monitor, moon: Moon, palette: Palette, edit: Pencil, plus: Plus,
  refresh: RefreshCw, search: Search, server: Server, settings: Settings, shield: Shield, sun: Sun,
  terminal: Terminal, trash: Trash2, upload: Upload, user: UserRound, x: X, zap: Zap,
  cpu: Cpu, memory: MemoryStick, disk: HardDrive, network: Network, circle: Circle,
  sort: ChevronsUpDown, save: Save, external: ExternalLink, reset: RotateCcw,
  filter: SlidersHorizontal, link: Link, export: ArrowDownToLine,
  grid: LayoutGrid, list: List, map: Map, wallet: Wallet, calendar: CalendarDays, clock: Clock,
  'arrow-down': ArrowDown, 'arrow-up': ArrowUp, layers: Layers, gauge: CircleGauge,
}
</script>
