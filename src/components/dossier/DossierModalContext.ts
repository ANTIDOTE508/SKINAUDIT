'use client'

import { createContext, useContext } from 'react'

/** Where the add-product flow starts: the empty-Dossier screen (02) or the
 *  add-method choice (03), when the page already shows its own entry point. */
export type DossierModalStart = 'empty' | 'method'

export const DossierModalContext = createContext<(startAt: DossierModalStart) => void>(() => {})

/** Opens the Dossier modal owned by StudioShell. */
export function useOpenDossierModal() {
  return useContext(DossierModalContext)
}
