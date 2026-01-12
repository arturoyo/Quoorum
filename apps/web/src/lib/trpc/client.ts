import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@forum/api";

export const api = createTRPCReact<AppRouter>();
