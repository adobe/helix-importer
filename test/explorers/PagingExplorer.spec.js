/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable max-classes-per-file, class-methods-use-this */

import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';

import { Response } from 'node-fetch';

import PagingExplorer from '../../src/explorer/PagingExplorer.js';

describe('PagingExplorer tests', () => {
  const params = {
    url: 'testdest',
    nbMaxPages: 3,
  };

  it('fetch and process are called 3 times if end not reached', async () => {
    let fetchCalled = 0;
    let processCalled = 0;

    class Test extends PagingExplorer {
      async fetch() {
        fetchCalled += 1;
        return new Response('test');
      }

      process() {
        processCalled += 1;
        return [{
          a: 1,
        }];
      }
    }

    const se = new Test(params);
    await se.explore();

    strictEqual(fetchCalled, 3, 'process is called 3 times');
    strictEqual(processCalled, 3, 'process is called 3 times');
  });

  it('fetch stops the process when reaches the end', async () => {
    let fetchCalled = 0;
    let processCalled = 0;

    class Test extends PagingExplorer {
      async fetch() {
        fetchCalled += 1;
        if (fetchCalled > 1) {
          return new Response('reached the end', { status: 404 });
        }
        return new Response('test');
      }

      process() {
        processCalled += 1;
        return [{
          a: 1,
        }];
      }
    }

    const se = new Test(params);
    await se.explore();

    strictEqual(fetchCalled, 2, 'fetch is called 2 times');
    strictEqual(processCalled, 1, 'process is called 1 time');
  });

  it('explore returns the expected result set', async () => {
    let processCalled = 0;
    class Test extends PagingExplorer {
      async fetch() {
        return new Response('test');
      }

      process() {
        processCalled += 1;
        return [{
          a: processCalled,
        }];
      }
    }

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [{ a: 1 }, { a: 2 }, { a: 3 }], 'result is correct');
  });

  it('explore returns the expected result set when number of pages is not the max one', async () => {
    let fetchCalled = 0;
    let processCalled = 0;
    class Test extends PagingExplorer {
      async fetch() {
        fetchCalled += 1;
        if (fetchCalled > 2) {
          return new Response('reached the end', { status: 404 });
        }
        return new Response('test');
      }

      process() {
        processCalled += 1;
        return [{
          a: processCalled,
        }];
      }
    }

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [{ a: 1 }, { a: 2 }], 'result is correct');
  });

  it('explore, fetch and process can be used to retrieve multipage results', async () => {
    let fetchCalled = 0;
    class Test extends PagingExplorer {
      async fetch() {
        fetchCalled += 1;
        if (fetchCalled > 2) {
          return new Response('reached the end', { status: 404 });
        }
        return new Response(`<html>
          <body>
            <a href="a${fetchCalled}.html">a${fetchCalled}</a>
            <a href="b${fetchCalled}.html">b${fetchCalled}</a>
            <a href="c${fetchCalled}.html">c${fetchCalled}</a>
          </body
        </html>`);
      }

      process(document) {
        const entries = [];
        document.querySelectorAll('a').forEach((el) => {
          entries.push({
            link: el.getAttribute('href'),
          });
        });
        return entries;
      }
    }

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [
      { link: 'a1.html' },
      { link: 'b1.html' },
      { link: 'c1.html' },
      { link: 'a2.html' },
      { link: 'b2.html' },
      { link: 'c2.html' },
    ], 'result is correct');
  });

  it('process receives the entry set from previous pages', async () => {
    let fetchCalled = 0;
    class Test extends PagingExplorer {
      async fetch() {
        fetchCalled += 1;
        return new Response(`<html>
          <body>
            <a href="a${fetchCalled}.html">a${fetchCalled}</a>
            <a href="b${fetchCalled}.html">b${fetchCalled}</a>
            <a href="c${fetchCalled}.html">c${fetchCalled}</a>
          </body
        </html>`);
      }

      process(document, all) {
        const testResult = [];
        for (let i = 1; i < fetchCalled; i += 1) {
          testResult.push({ link: `a${i}.html` });
          testResult.push({ link: `b${i}.html` });
          testResult.push({ link: `c${i}.html` });
        }
        deepStrictEqual(all, testResult, 'all entries argument contains previous entries from previous pages');

        const entries = [];
        document.querySelectorAll('a').forEach((el) => {
          entries.push({
            link: el.getAttribute('href'),
          });
        });
        return entries;
      }
    }

    const se = new Test(params);
    await se.explore();
  });
});
