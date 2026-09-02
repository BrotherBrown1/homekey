// Single source of truth for every number the marketing pages show.
//
// Two kinds of numbers live here:
//   • STATS  — computed from the shipped grant data at build time, so they
//              can never drift from what the matcher actually searches.
//   • CLAIMS — the rounded-down "77+" style figures used in headline copy.
//              They are deliberately below the live counts so the copy
//              doesn't churn every time a program is added or paused.
//
// The assertions at the bottom make `next build` fail the moment a claim
// would overstate the data, so a stale "48+ states" can never ship.

import { FEDERAL_GRANTS } from "./data/seed-federal";
import { STATE_GRANTS } from "./data/seed-states";
import { LOCAL_GRANTS } from "./data/seed-local";

const ALL = [...FEDERAL_GRANTS, ...STATE_GRANTS, ...LOCAL_GRANTS];
const ACTIVE = ALL.filter((g) => (g.status ?? "active") === "active");

export const STATS = {
  /** Active programs across every level. */
  programs: ACTIVE.length,
  /** Active federal programs (apply in every state). */
  federal: ACTIVE.filter((g) => g.level === "federal").length,
  /** Distinct states (incl. DC) with at least one active state/local program. */
  states: new Set(ACTIVE.map((g) => g.state).filter(Boolean)).size,
  /** Active city + county programs. */
  local: ACTIVE.filter((g) => g.level === "city" || g.level === "county").length,
  /** The Curator re-verifies every source at least this often. */
  maxDataAgeDays: 7,
} as const;

/** Floor figures for headline copy — rendered as "77+", "48+". */
export const CLAIMS = {
  programs: 77,
  states: 48,
} as const;

/**
 * Average stackable grant benefit quoted in the hero. This is an editorial
 * figure, not derived from the database — keep it defensible.
 */
export const AVERAGE_BENEFIT = 18_400;

function assertClaim(label: string, claimed: number, actual: number) {
  if (actual < claimed) {
    throw new Error(
      `[stats] The site claims "${claimed}+ ${label}" but the grant data only has ${actual}. ` +
        `Lower CLAIMS.${label} in lib/stats.ts or add programs before shipping.`
    );
  }
}

assertClaim("programs", CLAIMS.programs, STATS.programs);
assertClaim("states", CLAIMS.states, STATS.states);
