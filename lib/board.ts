export type BoardRange = "all" | "today";

export function parseBoardRange(value: string | string[] | undefined): BoardRange {
  return value === "today" ? "today" : "all";
}
