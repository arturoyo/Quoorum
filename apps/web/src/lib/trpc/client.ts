import { createTRPCReact } from "@trpc/react-query";
import type { appRouter } from "@quoorum/api";

export const api = createTRPCReact<typeof appRouter>();
