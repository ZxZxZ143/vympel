import type {Instrumentation} from "next";

import {serverErrorRecord} from "@/lib/serverObservability";

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    console.error(JSON.stringify(serverErrorRecord(error, request, context)));
};
