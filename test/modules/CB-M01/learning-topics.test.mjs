import assert from "node:assert/strict";
import test from "node:test";
import { getLearningTopics } from "../../../src/modules/CB-M01/learning-topics.mjs";

test("Crypto 101 ships six bounded evergreen guides in every site language", () => {
  const en = getLearningTopics("en");
  const pt = getLearningTopics("pt-br");
  const es = getLearningTopics("es");
  assert.equal(en.length, 6);
  assert.equal(pt.length, 6);
  assert.equal(es.length, 6);
  assert.deepEqual(en.map(({ id }) => id), pt.map(({ id }) => id));
  assert.deepEqual(en.map(({ id }) => id), es.map(({ id }) => id));
  assert.equal(new Set(en.map(({ id }) => id)).size, 6);
  for (const guide of [...en, ...pt, ...es]) {
    assert.match(guide.id, /^[a-z]+$/u);
    for (const key of ["title", "summary", "checklist"]) {
      assert.equal(typeof guide[key], "string");
      assert.ok(guide[key].length >= 15, `Missing meaningful ${key} for ${guide.id}`);
      assert.ok(guide[key].length < 400, `Guide ${guide.id} has oversized ${key}`);
    }
    assert.ok(Object.isFrozen(guide));
  }
  assert.notEqual(en[0].title, pt[0].title);
  assert.notEqual(en[0].title, es[0].title);
  assert.match(es[0].summary, /cartera/u);
});

test("learning topics remain educational and without manufactured market figures", () => {
  const english = JSON.stringify(getLearningTopics("en"));
  assert.match(english, /wallet|network|transaction/u);
  assert.match(english, /risk|volatile/u);
  assert.doesNotMatch(english, /guaranteed profit is possible|buy now|\$[0-9]|https?:\/\//iu);
  assert.deepEqual(getLearningTopics("unknown"), getLearningTopics("en"));
});
