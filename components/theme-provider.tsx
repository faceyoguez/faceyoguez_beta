"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Re-export type if needed or use directly
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
