import { defineConfig } from "vitest/config";

// These are integration tests against a REAL running API + real Postgres
// (issue #35), not unit tests with mocks -- no jsdom/browser environment is
// needed, plain Node is correct. testTimeout is raised above vitest's 5s
// default since each test makes several real sequential HTTP round-trips
// against a live server.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
  },
});
