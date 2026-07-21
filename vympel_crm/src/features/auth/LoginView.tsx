"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CrmApiError, crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { getAccessToken, saveSession } from "@/shared/api/session";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

type LoginFormValues = {
  email: string;
  password: string;
};

function withSeconds(message: string, seconds: number) {
  return message.replace("{seconds}", String(seconds));
}

export function LoginView() {
  const router = useRouter();
  const notifications = useNotifications();
  const { t } = useI18n();
  const { handleSubmit, register } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    let active = true;

    if (getAccessToken()) {
      router.replace("/dashboard");
      return () => {
        active = false;
      };
    }

    crmApi
      .restoreSession()
      .then(() => {
        if (active) {
          router.replace("/dashboard");
        }
      })
      .catch((restoreError: unknown) => {
        if (!active) {
          return;
        }

        if (!(restoreError instanceof CrmApiError) || restoreError.status !== 401) {
          setError(t("login.restoreFailed"));
        }
        setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [router, t]);

  const submit = async (values: LoginFormValues) => {
    if (loading || retryAfterSeconds > 0) {
      return;
    }

    if (!values.email.trim() || !values.password) {
      setError(t("login.invalid"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await crmApi.login(values.email.trim(), values.password);
      saveSession(response.accessToken);
      notifications.success(t("login.success"));
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof CrmApiError && error.status === 429) {
        const retryAfter = Math.max(1, error.retryAfterSeconds ?? 60);
        setRetryAfterSeconds(retryAfter);
        const message = withSeconds(t("login.rateLimited"), retryAfter);
        setError(message);
        notifications.error(message);
        return;
      }
      const message = getCrmErrorMessage(error, t("login.failed"));
      setError(message);
      notifications.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (restoring) {
    return (
      <main className="crm-login">
        <section className="crm-panel crm-login__panel">
          <div className="crm-panel__body">
            <Heading as="h1" size="title">
              {t("login.loading")}
            </Heading>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="crm-login">
      <section className="crm-panel crm-login__panel">
        <div className="crm-panel__body crm-grid">
          <div className="crm-grid">
            <Heading as="h1" size="display">
              {t("login.title")}
            </Heading>
            <Text tone="muted">{t("login.subtitle")}</Text>
          </div>

          <form className="crm-grid" onSubmit={handleSubmit(submit)}>
            <Field htmlFor="email" label={t("login.email")}>
              <input
                {...register("email")}
                id="email"
                className="crm-input"
                type="email"
                autoComplete="email"
              />
            </Field>

            <Field htmlFor="password" label={t("login.password")}>
              <input
                {...register("password")}
                id="password"
                className="crm-input"
                type="password"
                autoComplete="current-password"
              />
            </Field>

            {error && <Text className="crm-form-error">{error}</Text>}

            <Button type="submit" isLoading={loading} disabled={loading || retryAfterSeconds > 0}>
              {loading
                ? t("login.loading")
                : retryAfterSeconds > 0
                  ? withSeconds(t("login.retryIn"), retryAfterSeconds)
                  : t("login.submit")}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
