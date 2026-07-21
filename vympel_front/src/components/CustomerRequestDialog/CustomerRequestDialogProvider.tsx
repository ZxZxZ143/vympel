"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import type {ChangeEvent, PropsWithChildren} from "react";
import {toast} from "sonner";
import {Controller, useForm} from "react-hook-form";
import {useTranslations} from "use-intl";

import Button from "@/components/ui/shared/Button";
import {Text} from "@/components/ui/shared/text";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import {cn} from "@/lib/utils";

type CustomerRequestTitle = "request" | "question";

type CustomerRequestDialogOptions = {
    source?: string;
    title?: CustomerRequestTitle;
    message?: string;
};

type CustomerRequestDialogContextValue = {
    openCustomerRequest: (options?: CustomerRequestDialogOptions) => void;
};

type CustomerRequestFormValues = {
    name: string;
    email: string;
    phone: string;
    message: string;
    website: string;
};

const CustomerRequestDialogContext = createContext<CustomerRequestDialogContextValue | null>(null);

const defaultValues: CustomerRequestFormValues = {
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "",
};

const emailPattern = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;
const KZ_PHONE_COUNTRY_CODE = "7";
const KZ_PHONE_LOCAL_DIGIT_COUNT = 10;
const KZ_PHONE_TOTAL_DIGIT_COUNT = KZ_PHONE_LOCAL_DIGIT_COUNT + KZ_PHONE_COUNTRY_CODE.length;

function getPhoneDigits(value: string) {
    const digits = value.replace(/\D/g, "");

    if (!digits) return "";

    const trimmed = value.trim();
    const hasExplicitCountryPrefix = trimmed.startsWith("+7");

    if (digits.startsWith("8")) {
        return `${KZ_PHONE_COUNTRY_CODE}${digits.slice(1, KZ_PHONE_TOTAL_DIGIT_COUNT)}`;
    }

    if (digits.startsWith("7") && (hasExplicitCountryPrefix || digits.length > KZ_PHONE_LOCAL_DIGIT_COUNT)) {
        return `${KZ_PHONE_COUNTRY_CODE}${digits.slice(1, KZ_PHONE_TOTAL_DIGIT_COUNT)}`;
    }

    return `${KZ_PHONE_COUNTRY_CODE}${digits.slice(0, KZ_PHONE_LOCAL_DIGIT_COUNT)}`;
}

function getLocalPhoneDigits(value: string) {
    return getPhoneDigits(value).slice(KZ_PHONE_COUNTRY_CODE.length);
}

function formatKazakhstanPhone(value: string) {
    const digits = getPhoneDigits(value);

    if (!digits) return "";

    const localDigits = digits.slice(KZ_PHONE_COUNTRY_CODE.length);

    if (!localDigits) return "+7";

    const groups = [
        localDigits.slice(0, 3),
        localDigits.slice(3, 6),
        localDigits.slice(6, 8),
        localDigits.slice(8, 10),
    ].filter(Boolean);

    return ["+7", ...groups].join(" ");
}

function normalizeKazakhstanPhone(value: string) {
    const digits = getPhoneDigits(value);

    return digits.length === KZ_PHONE_TOTAL_DIGIT_COUNT ? `+${digits}` : "";
}

function getLocalDigitCountBeforeCaret(value: string, caretPosition: number) {
    const beforeCaret = value.slice(0, caretPosition);

    return Math.min(
        getLocalPhoneDigits(beforeCaret).length,
        getLocalPhoneDigits(value).length
    );
}

function getPhoneCaretPosition(formattedValue: string, localDigitCount: number) {
    if (!formattedValue) return 0;
    if (localDigitCount <= 0) return formattedValue.length > 2 ? 3 : formattedValue.length;

    let seenLocalDigits = 0;

    for (let index = 0; index < formattedValue.length; index += 1) {
        const char = formattedValue[index];
        const isCountryCodeDigit = formattedValue.startsWith("+7") && index === 1;

        if (/\d/.test(char) && !isCountryCodeDigit) {
            seenLocalDigits += 1;

            if (seenLocalDigits >= localDigitCount) {
                return index + 1;
            }
        }
    }

    return formattedValue.length;
}

function handlePhoneInputChange(
    event: ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
) {
    const input = event.currentTarget;
    const caretPosition = input.selectionStart ?? input.value.length;
    const localDigitCount = getLocalDigitCountBeforeCaret(input.value, caretPosition);
    const formattedValue = formatKazakhstanPhone(input.value);
    const nextCaretPosition = getPhoneCaretPosition(formattedValue, localDigitCount);

    onChange(formattedValue);

    window.requestAnimationFrame(() => {
        if (document.activeElement !== input) return;

        input.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
}

export function CustomerRequestDialogProvider({children}: PropsWithChildren) {
    const t = useTranslations("requestDialog");
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<CustomerRequestDialogOptions>({title: "request"});
    const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
    const openerRef = useRef<HTMLElement | null>(null);
    const {
        formState: {errors, isSubmitting},
        control,
        getValues,
        handleSubmit,
        register,
        reset,
        setError,
    } = useForm<CustomerRequestFormValues>({defaultValues});

    const openCustomerRequest = useCallback((nextOptions: CustomerRequestDialogOptions = {}) => {
        openerRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setOptions({
            source: nextOptions.source,
            title: nextOptions.title ?? "request",
            message: nextOptions.message,
        });
        reset({
            ...defaultValues,
            message: nextOptions.message ?? "",
        });
        setOpen(true);
    }, [reset]);

    const contextValue = useMemo<CustomerRequestDialogContextValue>(() => ({
        openCustomerRequest,
    }), [openCustomerRequest]);

    useEffect(() => {
        if (retryAfterSeconds <= 0) return;
        const timer = window.setTimeout(() => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [retryAfterSeconds]);

    const validateContact = () => {
        const email = getValues("email").trim();
        const phone = getLocalPhoneDigits(getValues("phone"));
        return Boolean(email || phone) || t("validation.contact");
    };

    const submit = handleSubmit(async (values) => {
        const email = values.email.trim();
        const phone = normalizeKazakhstanPhone(values.phone);

        if (!email && !phone) {
            setError("email", {type: "validate", message: t("validation.contact")});
            setError("phone", {type: "validate", message: t("validation.contact")});
            return;
        }

        try {
            await PublicApiController.createCustomerRequest({
                name: values.name.trim() || null,
                email: email || null,
                phone: phone || null,
                message: values.message.trim() || null,
                source: options.source ?? null,
                website: values.website.trim() || null,
            });

            toast.success(t("success.title"), {
                description: t("success.description"),
            });
            reset(defaultValues);
            setOpen(false);
        } catch (error) {
            if (error instanceof ApiError && error.status === 429) {
                const retryAfter = Math.max(1, error.retryAfterSeconds ?? 60);
                setRetryAfterSeconds(retryAfter);
                toast.error(t("rateLimit.title"), {
                    description: t("rateLimit.description", {seconds: retryAfter}),
                });
                return;
            }
            toast.error(t("error.title"), {
                description: t("error.description"),
            });
        }
    }, () => {
        toast.error(t("validation.title"));
    });

    return (
        <CustomerRequestDialogContext.Provider value={contextValue}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    aria-describedby="customer-request-description"
                    closeLabel={t("close")}
                    className="customer-request-dialog gap-0"
                    onCloseAutoFocus={(event) => {
                        if (!openerRef.current?.isConnected) return;
                        event.preventDefault();
                        openerRef.current.focus();
                    }}
                >
                    <DialogTitle className="customer-request-dialog__title">
                        {t(`titles.${options.title ?? "request"}`)}
                    </DialogTitle>
                    <DialogDescription id="customer-request-description" className="sr-only">
                        {t("description")}
                    </DialogDescription>

                    <div className="customer-request-dialog__body">
                        <form className="customer-request-form" onSubmit={submit} noValidate>
                            <input
                                {...register("website")}
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                                aria-hidden="true"
                            />
                            <RequestField
                                label={t("fields.name")}
                                error={errors.name?.message}
                            >
                                <input
                                    {...register("name", {
                                        maxLength: {value: 160, message: t("validation.nameLength")},
                                    })}
                                    className="customer-request-input"
                                    placeholder={t("placeholders.name")}
                                    autoComplete="name"
                                />
                            </RequestField>
                            <RequestField
                                label={t("fields.email")}
                                error={errors.email?.message}
                            >
                                <input
                                    {...register("email", {
                                        validate: (value) => {
                                            const contact = validateContact();
                                            if (contact !== true) return contact;
                                            const email = value.trim();
                                            return !email || emailPattern.test(email) || t("validation.email");
                                        },
                                        maxLength: {value: 255, message: t("validation.emailLength")},
                                    })}
                                    className="customer-request-input"
                                    placeholder={t("placeholders.email")}
                                    autoComplete="email"
                                    inputMode="email"
                                />
                            </RequestField>
                            <Text as="span" size="bodySm" className="customer-request-or">
                                {t("or")}
                            </Text>
                            <RequestField
                                label={t("fields.phone")}
                                error={errors.phone?.message}
                            >
                                <Controller
                                    control={control}
                                    name="phone"
                                    rules={{
                                        validate: (value) => {
                                            const contact = validateContact();
                                            if (contact !== true) return contact;
                                            const localDigits = getLocalPhoneDigits(value);
                                            if (!localDigits) return true;
                                            return normalizeKazakhstanPhone(value) ? true : t("validation.phone");
                                        },
                                    }}
                                    render={({field}) => (
                                        <input
                                            ref={field.ref}
                                            name={field.name}
                                            value={field.value}
                                            onBlur={field.onBlur}
                                            onChange={(event) => handlePhoneInputChange(event, field.onChange)}
                                            className="customer-request-input"
                                            placeholder={t("placeholders.phone")}
                                            autoComplete="tel"
                                            inputMode="tel"
                                        />
                                    )}
                                />
                            </RequestField>
                            <RequestField
                                label={t("fields.message")}
                                error={errors.message?.message}
                                className="customer-request-form__last-field"
                            >
                                <textarea
                                    {...register("message", {
                                        maxLength: {value: 2000, message: t("validation.messageLength")},
                                    })}
                                    className="customer-request-input customer-request-input--textarea"
                                    placeholder={t("placeholders.message")}
                                />
                            </RequestField>
                            <Button
                                type="submit"
                                variant="action"
                                disabled={isSubmitting || retryAfterSeconds > 0}
                                className="customer-request-submit"
                            >
                                <Text as="span" colors="inverse" size="bodyLg" className="leading-none">
                                    {isSubmitting
                                        ? t("submitting")
                                        : retryAfterSeconds > 0
                                            ? t("rateLimit.retryIn", {seconds: retryAfterSeconds})
                                            : t("submit")}
                                </Text>
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </CustomerRequestDialogContext.Provider>
    );
}

export function useCustomerRequestDialog() {
    const context = useContext(CustomerRequestDialogContext);

    if (!context) {
        throw new Error("useCustomerRequestDialog must be used inside CustomerRequestDialogProvider");
    }

    return context;
}

function RequestField({
    children,
    className,
    error,
    label,
}: PropsWithChildren<{
    className?: string;
    error?: string;
    label: string;
}>) {
    return (
        <label className={cn("customer-request-field", className)}>
            <span className="customer-request-label">{label}</span>
            {children}
            {error ? <span className="customer-request-error">{error}</span> : null}
        </label>
    );
}
