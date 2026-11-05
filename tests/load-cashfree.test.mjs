import test from "node:test";
import assert from "node:assert/strict";
import { loadCashfree } from "../src/lib/load-cashfree.js";

test("payment SDK failure can be retried, and concurrent requests share one load", async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({ remove() {} }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  try {
    const failure = loadCashfree();
    const rejected = assert.rejects(failure, /could not load/);
    scripts[0].onerror();
    await rejected;
    const next = loadCashfree();
    assert.equal(loadCashfree(), next);
    assert.equal(scripts.length, 2);
    window.Cashfree = () => {};
    scripts[1].onload();
    assert.equal(await next, window.Cashfree);
    assert.equal(await loadCashfree(), window.Cashfree);
    assert.equal(scripts.length, 2);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
