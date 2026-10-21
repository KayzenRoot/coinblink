import test from "node:test";
import assert from "node:assert/strict";
import { listMockTopics, createMockReadingPath } from "../../../src/modules/CB-M02/news-reader-guide.mjs";
import { listMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";
import { newsCopy, localizeMockNews } from "../../../src/modules/CB-M02/news-i18n.mjs";

test("M02 offline topics count exactly the three existing fictional fixtures", () => {
  const topics = listMockTopics();
  assert.deepEqual(topics.map(x => [x.category, x.count]),
    [["security",1],["protocol",1],["education",1]]);
  assert.equal(topics.reduce((sum,x) => sum + x.count,0), listMockNews().items.length);
  assert.ok(Object.isFrozen(topics) && topics.every(Object.isFrozen));
  assert.ok(topics.every(x => x.status === "MOCK_ONLY_NOT_PUBLISHED"));
});

test("M02 reading path is immutable, ordered and contains no private fields", () => {
  const rows = listMockNews().items;
  rows.forEach((row,index) => {
    const path = createMockReadingPath(row.slug);
    assert.equal(path.status, "MOCK_PATH_NOT_PUBLISHED");
    assert.equal(path.position, index+1);
    assert.equal(path.total, rows.length);
    assert.equal(path.previous?.slug,rows[index-1]?.slug);
    assert.equal(path.next?.slug,rows[index+1]?.slug);
    assert.ok(Object.isFrozen(path));
    assert.ok(!path.previous || Object.isFrozen(path.previous));
    assert.ok(!path.next || Object.isFrozen(path.next));
    assert.doesNotMatch(JSON.stringify(path), /"body"|"summary"|"source_url"|"secret"|"rights"/u);
    assert.ok(localizeMockNews(row,"pt-br").title);
  });
  assert.equal(newsCopy("pt-br").readingPath, "Percurso de leitura fictícia");
});

test("M02 noncanonical and nonexistent slugs have no related content", () => {
  for (const slug of [null,undefined,42,"/admin","demo-draft-001","not-real"]) {
    const path = createMockReadingPath(slug);
    assert.deepEqual(path,{status:"NOT_FOUND",position:0,total:0,previous:null,next:null});
    assert.ok(Object.isFrozen(path));
  }
});
