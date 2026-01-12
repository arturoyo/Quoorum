/**
 * Inngest Client Stub
 * TODO: Configure actual Inngest client for production
 */

const isDev = process.env.NODE_ENV === "development";

export interface InngestEvent {
  name: string;
  data: Record<string, unknown>;
}

export const inngest = {
  send: async (event: InngestEvent) => {
    if (isDev) {
      // Only log in development
      // eslint-disable-next-line no-console
      console.log("[Inngest] Event triggered:", event.name, event.data);
    }
    return { ids: [crypto.randomUUID()] };
  },
  createFunction: () => {
    // Stub for function creation
  },
};

export default inngest;
