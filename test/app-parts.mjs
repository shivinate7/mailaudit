/* The parts of test/app.test.mjs, and the gate its part blocks ask.

   The suite waits on real timers, so CI runs it as PART_COUNT parts on separate runners.
   MAILDAY_TEST_PART=n runs part n alone. With none set, every part runs in order, as one suite.
   test/ci-wiring.test.mjs reads PART_COUNT, and checks that each part runs in exactly one step of
   the suite job. It lives here, and not in the suite file, so that no check has to scan source text. */

export const PART_COUNT = 3;

/* The part that env names: 0 for every part (unset or empty), 1 to `count` for one part. Any other
   value throws. A mistyped part would otherwise select no block, run no case and report green. */
export function partFromEnv(env, count = PART_COUNT) {
  const v = env.MAILDAY_TEST_PART ?? "";
  if (v === "") return 0;
  if (!/^[1-9]\d*$/.test(v) || Number(v) > count)
    throw new Error(`MAILDAY_TEST_PART must be 1 to ${count}, or unset to run every part (got "${v}")`);
  return Number(v);
}

/* inPart(n) is the question a part block asks; check() runs after the last block. It throws unless
   parts 1 to `count` each asked once, so a count that names a part with no block cannot pass by
   running nothing, and a block that no count names cannot hide. */
export function partGate(env, count = PART_COUNT) {
  const part = partFromEnv(env, count);
  const asked = new Map();
  return {
    part,
    inPart(n) {
      asked.set(n, (asked.get(n) ?? 0) + 1);
      return part === 0 || part === n;
    },
    check() {
      for (let n = 1; n <= count; n++) {
        if (asked.get(n) !== 1) throw new Error(`part ${n} of ${count} has ${asked.get(n) ?? 0} blocks in the app suite; expected 1`);
      }
      const extra = [...asked.keys()].filter((n) => !(n >= 1 && n <= count));
      if (extra.length) throw new Error(`the app suite has blocks for part ${extra.join(", ")}, beyond the count of ${count}`);
    },
  };
}
