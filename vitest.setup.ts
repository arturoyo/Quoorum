import { vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
process.env.OPENAI_API_KEY = "sk-test-key";
process.env.NODE_ENV = "test";

// Mock external services
vi.mock("openai", () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Mock response" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      },
    };
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    };
  },
}));

vi.mock("redis", () => ({
  createClient: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }),
}));
