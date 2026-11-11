import { describe, expect, it } from "vitest";

import { prisma } from "../src/database/prisma.js";

describe("Test database", () => {
  it("connects to PostgreSQL", async () => {
    const result =
      await prisma.$queryRaw<
        { result: number }[]
      >`SELECT 1 as result`;

    expect(result[0]?.result).toBe(1);
  });
});