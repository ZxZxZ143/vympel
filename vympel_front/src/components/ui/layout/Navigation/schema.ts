import { z } from "zod";

export const searchSchema = z.object({
    query: z.string().trim().min(1, ""),
});

export type SearchFormValues = z.infer<typeof searchSchema>;
