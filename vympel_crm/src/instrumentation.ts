import type {Instrumentation} from "next";

import {crmServerErrorRecord} from "@/shared/observability/serverError";

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error(JSON.stringify(crmServerErrorRecord(error, request, context)));
};
