// Lucide-style SVG icon components for MC Crash Analyzer
import { h } from 'vue';

const createIcon = (paths) => ({
  props: { size: { type: [Number, String], default: 24 } },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        paths.map((d) => h('path', { d, innerHTML: d.includes('<') ? d : undefined }))
      );
  },
});

// Simple icon with just path d attributes
const icon = (paths) => createIcon(paths);

export const IconUpload = icon([
  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  'M17 8l-5-5-5 5',
  'M12 3v12',
]);
export const IconClipboard = icon([
  'M8 2h8a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
  'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
]);
export const IconSparkles = icon([
  'M12 3 9.268 8.268 4 11l5.268 2.732L12 19l2.732-5.268L20 11l-5.268-2.732z',
]);
export const IconBarChart3 = icon([
  'M3 3v18h18',
  'M18 17V9',
  'M13 17V5',
  'M8 17v-3',
]);
export const IconSearch = icon([
  'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  'M21 21l-4.35-4.35',
]);
export const IconLightbulb = icon([
  'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
  'M9 18h6',
  'M10 22h4',
]);
export const IconTarget = icon([
  'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 0 20z',
  'M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0z',
  'M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
]);
export const IconPuzzle = icon([
  'M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.706 2.404 2.404 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.404 2.404 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.611-1.611a2.404 2.404 0 0 1 1.704-.706c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z',
]);
export const IconSettings = icon([
  'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
]);
export const IconClock = icon([
  'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 0 20z',
  'M12 6v6l4 2',
]);
export const IconScrollText = icon([
  'M8 6h8', 'M8 10h8', 'M8 14h6',
  'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20',
]);
export const IconBookOpen = icon([
  'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
  'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
]);
export const IconRefreshCw = icon([
  'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
  'M21 3v5h-5',
  'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
  'M3 21v-5h5',
]);
export const IconTrash2 = icon([
  'M3 6h18',
  'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
  'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  'M10 11v6',
  'M14 11v6',
]);
export const IconUser = icon([
  'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
  'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
]);
export const IconLogOut = icon([
  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
  'M16 17l5-5-5-5',
  'M21 12H9',
]);
export const IconLogIn = icon([
  'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4',
  'M10 17l5-5-5-5',
  'M15 12H3',
]);
export const IconFileText = icon([
  'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
  'M14 2v6h6',
  'M16 13H8',
  'M16 17H8',
  'M10 9H8',
]);
export const IconX = icon([
  'M18 6 6 18',
  'M6 6l12 12',
]);
export const IconAlertTriangle = icon([
  'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  'M12 9v4',
  'M12 17h.01',
]);
export const IconFolderOpen = icon([
  'M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2',
]);
export const IconAlertCircle = icon([
  'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 0 20z',
  'M12 8v4',
  'M12 16h.01',
]);
export const IconShare = icon([
  'M22 2 11 13',
  'M22 2l-7 20-4-9-9-4 20-7z',
]);
export const IconBot = icon([
  'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z',
  'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  'M12 7v4',
  'M8 16h.01',
  'M16 16h.01',
]);
