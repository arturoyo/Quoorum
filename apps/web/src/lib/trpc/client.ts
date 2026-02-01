import { createTRPCReact } from "@trpc/react-query";

// NOTE: Use a widened type to avoid monorepo router type collisions during tsc at root.
export const api: any = createTRPCReact<any>();
