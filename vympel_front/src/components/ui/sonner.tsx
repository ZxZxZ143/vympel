"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-text-heading-secondary" />,
        info: <InfoIcon className="size-4 text-text-heading-secondary" />,
        warning: <TriangleAlertIcon className="size-4 text-text-heading-secondary" />,
        error: <OctagonXIcon className="size-4 text-error" />,
        loading: <Loader2Icon className="size-4 animate-spin text-text-heading-secondary" />,
      }}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast vympel-toast group-[.toaster]:rounded-2xl group-[.toaster]:border-border-default group-[.toaster]:bg-toast-surface group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:font-sans group-[.toaster]:text-text-primary group-[.toaster]:shadow-toast sm:group-[.toaster]:px-5 sm:group-[.toaster]:py-4",
          title:
            "vympel-toast-title !mr-8 !whitespace-normal !break-words group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:leading-6 group-[.toast]:text-toast-title",
          description:
            "vympel-toast-description !mr-8 !whitespace-normal !break-words group-[.toast]:text-xs group-[.toast]:font-light group-[.toast]:leading-5 group-[.toast]:text-toast-description",
          actionButton:
            "vympel-toast-action !px-3 !rounded-full group-[.toast]:border group-[.toast]:border-border-default group-[.toast]:bg-toast-action group-[.toast]:py-1.5 group-[.toast]:font-medium group-[.toast]:text-toast-action-text group-[.toast]:transition group-[.toast]:hover:bg-toast-action/90",
          cancelButton:
            "group-[.toast]:rounded-full group-[.toast]:border group-[.toast]:border-border-default group-[.toast]:bg-primary-bg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-text-heading-secondary",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
