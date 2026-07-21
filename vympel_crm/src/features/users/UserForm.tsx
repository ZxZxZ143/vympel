"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { crmApi } from "@/shared/api/client";
import { getCrmErrorMessage } from "@/shared/api/errors";
import { CrmRole, ManagedUser, UserPayload } from "@/shared/api/types";
import { useNotifications } from "@/shared/feedback/NotificationProvider";
import { useI18n } from "@/shared/i18n/useI18n";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { Heading } from "@/shared/ui/Heading";
import { Text } from "@/shared/ui/Text";

type UserFormProps = {
  userId?: number;
};

type UserFormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  enabled: boolean;
};

const emptyForm: UserFormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "MANAGER",
  enabled: true,
};

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const notifications = useNotifications();
  const { t, messages } = useI18n();
  const [roles, setRoles] = useState<CrmRole[]>([]);
  const { control, handleSubmit, reset, setValue } = useForm<UserFormState>({
    defaultValues: emptyForm,
  });
  const form = (useWatch({ control }) ?? emptyForm) as UserFormState;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = userId !== undefined;

  useEffect(() => {
    let alive = true;

    Promise.all([
      crmApi.userRoles(),
      userId === undefined ? Promise.resolve(null) : crmApi.user(userId),
    ])
      .then(([nextRoles, user]) => {
        if (!alive) {
          return;
        }

        setRoles(nextRoles);
        if (user) {
          reset(userToForm(user));
        } else if (!nextRoles.some((role) => role.code === emptyForm.role) && nextRoles[0]) {
          reset({ ...emptyForm, role: nextRoles[0].code });
        }
        setError(null);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [reset, userId, t]);

  const updateField = <Field extends keyof UserFormState>(field: Field, value: UserFormState[Field]) => {
    setValue(field, value as never, { shouldDirty: true });
  };

  const submit = async (values: UserFormState) => {
    if (saving) {
      return;
    }

    const validationError = validateForm(values, isEdit, t);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = toPayload(values, isEdit);
      if (isEdit) {
        await crmApi.updateUser(userId, payload);
        notifications.success(t("users.updated"));
      } else {
        await crmApi.createUser(payload);
        notifications.success(t("users.created"));
      }
      router.push("/users");
    } catch (error) {
      const message = getCrmErrorMessage(error, isEdit ? t("users.updateError") : t("users.createError"));
      setError(message);
      notifications.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Text tone="muted">{t("common.loading")}</Text>;
  }

  return (
    <section className="crm-page">
      <Text tone="muted">{t("users.subtitle")}</Text>

      {error && <Text className="crm-form-error">{error}</Text>}

      <form className="crm-page" onSubmit={handleSubmit(submit)}>
        <FormPanel title={isEdit ? t("users.editTitle") : t("users.createTitle")}>
          <div className="crm-grid crm-grid--form">
            <TextField id="email" type="email" label={t("users.email")} value={form.email} onChange={(value) => updateField("email", value)} />
            {!isEdit && (
              <TextField id="password" type="password" label={t("users.password")} value={form.password} onChange={(value) => updateField("password", value)} />
            )}
            <TextField id="firstName" label={t("users.firstName")} value={form.firstName} onChange={(value) => updateField("firstName", value)} />
            <TextField id="lastName" label={t("users.lastName")} value={form.lastName} onChange={(value) => updateField("lastName", value)} />
            <TextField id="phone" label={t("users.phone")} value={form.phone} onChange={(value) => updateField("phone", value)} />
            <SelectField id="role" label={t("users.role")} value={form.role} onChange={(value) => updateField("role", value)}>
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {messages.users.roles[role.code as keyof typeof messages.users.roles] ?? role.code}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="enabled"
              label={t("users.status")}
              value={form.enabled ? "enabled" : "disabled"}
              onChange={(value) => updateField("enabled", value === "enabled")}
            >
              <option value="enabled">{t("users.statuses.enabled")}</option>
              <option value="disabled">{t("users.statuses.disabled")}</option>
            </SelectField>
          </div>
        </FormPanel>

        <div className="crm-inline-actions">
          <Button type="submit" isLoading={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
          <Button variant="secondary" disabled={saving} onClick={() => router.push("/users")}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}

function FormPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="crm-panel">
      <div className="crm-panel__header">
        <Heading as="h2" size="title">
          {title}
        </Heading>
      </div>
      <div className="crm-panel__body">{children}</div>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field htmlFor={id} label={label}>
      <input id={id} className="crm-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Field htmlFor={id} label={label}>
      <select id={id} className="crm-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </Field>
  );
}

function validateForm(form: UserFormState, isEdit: boolean, t: (key: string) => string) {
  if (!form.email.trim() || !form.role.trim()) {
    return t("users.requiredError");
  }

  if (!isEdit && form.password.trim().length < 6) {
    return t("users.passwordError");
  }

  if (!form.email.includes("@")) {
    return t("users.emailError");
  }

  return null;
}

function toPayload(form: UserFormState, isEdit: boolean): UserPayload {
  return {
    email: form.email.trim(),
    password: isEdit ? undefined : form.password,
    firstName: form.firstName.trim() || null,
    lastName: form.lastName.trim() || null,
    phone: form.phone.trim() || null,
    roles: [form.role],
    enabled: form.enabled,
  };
}

function userToForm(user: ManagedUser): UserFormState {
  return {
    email: user.email ?? "",
    password: "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    role: user.roles[0] ?? "MANAGER",
    enabled: user.enabled,
  };
}
