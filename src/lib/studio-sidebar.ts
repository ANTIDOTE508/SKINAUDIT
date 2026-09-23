/** Remembers the desktop sidebar's collapsed state across visits. Read by
 *  `loadStudioContext()` on the server, written by the sidebar toggle. */
export const SIDEBAR_COOKIE = 'studio-sidebar'

export function saveSidebarCollapsed(collapsed: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`
}
