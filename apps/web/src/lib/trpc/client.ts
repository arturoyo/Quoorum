import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@quoorum/api";

export const api = createTRPCReact<AppRouter>();
