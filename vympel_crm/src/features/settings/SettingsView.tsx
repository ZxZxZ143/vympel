"use client";

import { useEffect, useState } from "react";
import { crmApi, crmApiBase } from "@/shared/api/client";
import { CrmUser } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/useI18n";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

export function SettingsView() {
  const { t } = useI18n();
  const [user, setUser] = useState<CrmUser | null>(null);

  useEffect(() => {
    crmApi.me().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <section className="crm-page">
      <Text tone="muted">{t("settings.subtitle")}</Text>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">
            {t("settings.apiBase")}
          </Heading>
        </div>
        <div className="crm-panel__body crm-grid">
          <Text>{crmApiBase}</Text>
          <Text tone="muted">{t("settings.tokenStorage")}</Text>
        </div>
      </section>

      <section className="crm-panel">
        <div className="crm-panel__header">
          <Heading as="h2" size="title">
            {t("settings.currentUser")}
          </Heading>
        </div>
        <div className="crm-panel__body crm-grid">
          <Text>{user?.email ?? t("common.loading")}</Text>
          <Text tone="muted">{user?.roles.join(", ") ?? t("common.loading")}</Text>
        </div>
      </section>
    </section>
  );
}
