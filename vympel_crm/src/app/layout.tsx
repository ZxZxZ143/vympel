import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NotificationProvider } from "@/shared/feedback/NotificationProvider";
import { TelemetryProvider } from "@/shared/telemetry/TelemetryProvider";
import { CRM_PRIVATE_METADATA } from "@/shared/seo/metadata";
import "./globals.css";

export const metadata: Metadata = CRM_PRIVATE_METADATA;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <TelemetryProvider><NotificationProvider>{children}</NotificationProvider></TelemetryProvider>
      </body>
    </html>
  );
}
