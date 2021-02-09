/* tslint:disable: max-classes-per-file */

import PagingExplorer from "../../src/explorer/PagingExplorer";
import PagingExplorerParams from "../../src/explorer/PagingExplorerParams";

import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from "mocha";

import { Response } from 'node-fetch';
import { Document } from 'jsdom';

describe('PagingExplorer tests', () => {
  const params: PagingExplorerParams = {
    url: 'testdest',
    nbMaxPages: 3
  };

  it('fetch and process are called 3 times if end not reached', async () => {
    let fetchCalled = 0;
    let processCalled = 0;

    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        fetchCalled++;
        return new Response('test');
      }

      process(_document: Document): object[] {
        processCalled++;
        return [{
          a: 1
        }];
      }
    };

    const se = new Test(params);
    await se.explore();

    strictEqual(fetchCalled, 3, 'process is called 3 times');
    strictEqual(processCalled, 3, 'process is called 3 times');
  });

  it('fetch stops the process when reaches the end', async () => {
    let fetchCalled = 0;
    let processCalled = 0;

    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        fetchCalled++;
        if (fetchCalled > 1) {
          return new Response('reached the end', { status: 404 });
        }
        return new Response('test');
      }

      process(_document: Document): object[] {
        processCalled++;
        return [{
          a: 1
        }];
      }
    };

    const se = new Test(params);
    await se.explore();

    strictEqual(fetchCalled, 2, 'fetch is called 2 times');
    strictEqual(processCalled, 1, 'process is called 1 time');
  });

  it('explore returns the expected result set', async () => {
    let processCalled = 0;
    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        return new Response('test');
      }

      process(_document: Document): object[] {
        return [{
          a: ++processCalled,
        }];
      }
    };

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [{a: 1}, {a: 2}, {a: 3}], 'result is correct');
  });

  it('explore returns the expected result set when number of pages is not the max one', async () => {
    let fetchCalled = 0;
    let processCalled = 0;
    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        fetchCalled++;
        if (fetchCalled > 2) {
          return new Response('reached the end', { status: 404 });
        }
        return new Response('test');
      }

      process(_document: Document): object[] {
        processCalled++;
        return [{
          a: processCalled,
        }];
      }
    };

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [{a: 1}, {a: 2}], 'result is correct');
  });

  it('explore, fetch and process can be used to retrieve multipage results', async () => {
    let fetchCalled = 0;
    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        fetchCalled++;
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

      process(document: Document): object[] {
        const entries = [];
        document.querySelectorAll('a').forEach((el) => {
          entries.push({
            link: el.getAttribute('href')
          });
        });
        return entries;
      }
    };

    const se = new Test(params);
    const results = await se.explore();

    deepStrictEqual(results, [
      { link: 'a1.html' },
      { link: 'b1.html' },
      { link: 'c1.html' },
      { link: 'a2.html' },
      { link: 'b2.html' },
      { link: 'c2.html' }
    ], 'result is correct');
  });

  it('process receives the entry set from previous pages', async () => {
    let fetchCalled = 0;
    class Test extends PagingExplorer {
      async fetch(_page: number): Promise<Response> {
        fetchCalled++;
        return new Response(`<html>
          <body>
            <a href="a${fetchCalled}.html">a${fetchCalled}</a>
            <a href="b${fetchCalled}.html">b${fetchCalled}</a>
            <a href="c${fetchCalled}.html">c${fetchCalled}</a>
          </body
        </html>`);
      }

      process(document: Document, all: any): object[] {
        const testResult = [];
        for(let i=1; i < fetchCalled; i++) {
          testResult.push({ link: `a${i}.html` })
          testResult.push({ link: `b${i}.html` })
          testResult.push({ link: `c${i}.html` })
        }
        deepStrictEqual(all, testResult, 'all entries argument contains previous entries from previous pages');

        const entries = [];
        document.querySelectorAll('a').forEach((el) => {
          entries.push({
            link: el.getAttribute('href')
          });
        });
        return entries;
      }
    };

    const se = new Test(params);
    await se.explore();
  });

});

