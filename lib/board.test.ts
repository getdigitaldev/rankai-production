import { describe, expect, it } from "vitest";
import { parseBoardRange } from "./board";

describe("parseBoardRange", () => {
  it("returns 'today' only for the exact string 'today'", () => {
    expect(parseBoardRange("today")).toBe("today");
  });

  it("defaults to 'all' for anything else", () => {
    expect(parseBoardRange("all")).toBe("all");
    expect(parseBoardRange(undefined)).toBe("all");
    expect(parseBoardRange("")).toBe("all");
    expect(parseBoardRange(["today"])).toBe("all");
    expect(parseBoardRange("TODAY")).toBe("all");
  });
});
