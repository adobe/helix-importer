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

import {
  deepStrictEqual, ok, strictEqual, fail,
} from 'assert';
import { describe, it } from 'mocha';
import { docx2md } from '@adobe/helix-docx2md';
import MockMediaHandler from '../mocks/MockMediaHandler.js';

import DOMUtils from '../../src/utils/DOMUtils.js';
import {
  html2md,
  html2docx,
} from '../../src/importer/HTML2x.js';

import TestUtils from '../TestUtils.js';

const { createDocumentFromString } = TestUtils;

describe('html2x parameters', () => {
  const URL = 'https://www.sample.com/page.html';
  const ORIGNAL_URL = 'https://www.notproxyurl.com/folder/page.html';
  const HTML = '<html><head></head><body><h1>Hello World</h1></body></html>';

  const testParams = ({
    url,
    document,
    html,
    params,
  }) => {
    strictEqual(url, URL);
    strictEqual(params.originalURL, ORIGNAL_URL);
    strictEqual(html, HTML);

    const h1 = document.querySelector('h1');
    ok(h1);
    strictEqual(h1.textContent, 'Hello World');
  };

  it('parameters are correctly passed in single mode', async () => {
    await html2md(URL, HTML, {
      transformDOM: testParams,
      generateDocumentPath: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });

    await html2docx(URL, HTML, {
      transformDOM: testParams,
      generateDocumentPath: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });
  });

  it('parameters are correctly passed in multi mode', async () => {
    await html2md(URL, HTML, {
      transform: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });

    await html2docx(URL, HTML, {
      transform: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });
  });

  it('document can be a Document', async () => {
    const doc = createDocumentFromString(HTML);
    await html2md(URL, doc, {
      transformDOM: testParams,
      generateDocumentPath: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });

    await html2docx(URL, doc, {
      transformDOM: testParams,
      generateDocumentPath: testParams,
      preprocess: testParams,
    }, {
      createDocumentFromString,
    }, {
      originalURL: ORIGNAL_URL,
    });
  });

  it('document cannot be a string in the testing context', async () => {
    // we need JSDOM to create a document
    // because importer default implementation relies on DOMParser
    try {
      await html2md(URL, HTML, {
        transformDOM: testParams,
        generateDocumentPath: testParams,
        preprocess: testParams,
      }, {
        createDocumentFromString: null,
      }, {
        originalURL: ORIGNAL_URL,
      });
      fail('should have thrown an error: default createDocumentFromString works only in browser context');
    } catch (e) {
      ok(true);
    }

    try {
      await html2docx(URL, HTML, {
        transformDOM: testParams,
        generateDocumentPath: testParams,
        preprocess: testParams,
      }, {
        createDocumentFromString: null,
      }, {
        originalURL: ORIGNAL_URL,
      });
      fail('should have thrown an error: default createDocumentFromString works only in browser context');
    } catch (e) {
      ok(true);
    }
  });
});

describe('html2md tests', () => {
  it('html2md provides a default transformation', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', null, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><h1>Hello World</h1></body>');
    strictEqual(out.md.trim(), '# Hello World');
    strictEqual(out.path, '/page');
  });

  it('html2md accepts a string', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', null, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><h1>Hello World</h1></body>');
    strictEqual(out.md.trim(), '# Hello World');
    strictEqual(out.path, '/page');
  });

  it('html2md handles a custom transformation', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transformDOM: ({ document }) => {
        const p = document.createElement('p');
        p.innerHTML = 'My Hello to the World';
        return p;
      },
      generateDocumentPath: () => '/folder/my-custom-path',
    }, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<p>My Hello to the World</p>');
    strictEqual(out.md.trim(), 'My Hello to the World');
    strictEqual(out.path, '/folder/my-custom-path');
  });

  it('html2md handles multiple transform', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transform: ({ document }) => {
        const p1 = document.createElement('p');
        p1.innerHTML = 'My Hello to the World 1';

        const p2 = document.createElement('p');
        p2.innerHTML = 'My Hello to the World 2';

        return [{
          element: p1,
          path: '/my-custom-path-p1',
        }, {
          element: p2,
          path: '/folder/my-custom-path-p2',
        }];
      },
    }, {
      createDocumentFromString,
    });

    const out1 = out[0];
    strictEqual(out1.html.trim(), '<p>My Hello to the World 1</p>');
    strictEqual(out1.md.trim(), 'My Hello to the World 1');
    strictEqual(out1.path, '/my-custom-path-p1');

    const out2 = out[1];
    strictEqual(out2.html.trim(), '<p>My Hello to the World 2</p>');
    strictEqual(out2.md.trim(), 'My Hello to the World 2');
    strictEqual(out2.path, '/folder/my-custom-path-p2');
  });

  it('html2md handles multiple transform (but single output)', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transform: ({ document }) => {
        const p1 = document.createElement('p');
        p1.innerHTML = 'My Hello to the World 1';

        const p2 = document.createElement('p');
        p2.innerHTML = 'My Hello to the World 2';

        return {
          element: p1,
          path: '/my-custom-path-p1',
        };
      },
    }, {
      createDocumentFromString,
    });

    strictEqual(out.html.trim(), '<p>My Hello to the World 1</p>');
    strictEqual(out.md.trim(), 'My Hello to the World 1');
    strictEqual(out.path, '/my-custom-path-p1');
  });

  it('html2md allows to report when using transform', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transform: ({ document }) => {
        const p1 = document.createElement('p');
        p1.innerHTML = 'My Hello to the World 1';

        const p2 = document.createElement('p');
        p2.innerHTML = 'My Hello to the World 2';

        return [{
          element: p1,
          path: '/my-custom-path-p1',
          report: {
            custom: 'A custom property',
            customArray: ['a', 'b', 'c'],
            customObject: {
              a: 1,
              b: true,
              c: {
                d: 'e',
              },
            },
          },
        }, {
          element: p2,
          path: '/folder/my-custom-path-p2',
          report: {
            custom: 'Another value',
            customArray: ['a', 'b', 'c'],
            somethingElse: 'something else',
          },
        }];
      },
    }, {
      createDocumentFromString,
    });

    const out1 = out[0];
    strictEqual(out1.html.trim(), '<p>My Hello to the World 1</p>');
    strictEqual(out1.md.trim(), 'My Hello to the World 1');
    strictEqual(out1.path, '/my-custom-path-p1');
    ok(out1.report);
    strictEqual(out1.report.custom, 'A custom property');
    deepStrictEqual(out1.report.customArray, ['a', 'b', 'c']);
    deepStrictEqual(out1.report.customObject, { a: 1, b: true, c: { d: 'e' } });

    const out2 = out[1];
    strictEqual(out2.html.trim(), '<p>My Hello to the World 2</p>');
    strictEqual(out2.md.trim(), 'My Hello to the World 2');
    strictEqual(out2.path, '/folder/my-custom-path-p2');
    ok(out2.report);
    strictEqual(out2.report.custom, 'Another value');
    deepStrictEqual(out2.report.customArray, ['a', 'b', 'c']);
    strictEqual(out2.report.somethingElse, 'something else');
  });

  it('html2md allows no element to be provided when using transform', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transform: () => [{
        path: '/my-custom-path-p1',
        from: 'https://www.sample.com/page.html',
        report: {
          custom: 'A custom property',
          customArray: ['a', 'b', 'c'],
          customObject: {
            a: 1,
            b: true,
            c: {
              d: 'e',
            },
          },
        },
      }],
    }, {
      createDocumentFromString,
    });

    // if no element provided, no creation of html, md or docx
    strictEqual(out.html, undefined);
    strictEqual(out.md, undefined);
    strictEqual(out.docx, undefined);
    strictEqual(out.path, '/my-custom-path-p1');
    strictEqual(out.from, 'https://www.sample.com/page.html');
    ok(out.report);
    strictEqual(out.report.custom, 'A custom property');
    deepStrictEqual(out.report.customArray, ['a', 'b', 'c']);
    deepStrictEqual(out.report.customObject, { a: 1, b: true, c: { d: 'e' } });
  });

  it('html2md does not crash if transform returns null', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transform: () => null,
    }, {
      createDocumentFromString,
    });

    strictEqual(out.length, 0);
  });

  it('html2md can deal with null returning transformation', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transformDOM: () => null,
      generateDocumentPath: () => null,
    }, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><h1>Hello World</h1></body>');
    strictEqual(out.md.trim(), '# Hello World');
    strictEqual(out.path, '/page');
  });

  it('css background images are stored on elements and can be used during transformation', async () => {
    const out = await html2md(
      'https://www.sample.com/page.html',
      '<html><head><style>div { background-image: url("./image.png"); }</style></head><body><div>div witth background image!</div></body></html>',
      {
        transformDOM: ({ document }) => {
          const div = document.querySelector('div');
          const img = DOMUtils.getImgFromBackground(div, document);
          div.replaceWith(img);
          return document.body;
        },
      },
      {
        createDocumentFromString,
      },
    );
    strictEqual(out.html.trim(), '<body><img src="./image.png"></body>');
  });

  it('html2md removes images with src attributes', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><img src="data:abc"></body></html>', null, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body></body>');
    strictEqual(out.md.trim(), '');
  });

  it('html2md set image src with data-src attribute value', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><img src="data:abc" data-src="./image.jpg"></body></html>', null, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><img src="https://www.sample.com/image.jpg" data-src="./image.jpg"></body>');
    strictEqual(out.md.trim(), '![][image0]\n\n[image0]: https://www.sample.com/image.jpg');
  });

  it('html2md allows to preprocess the document', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><img src="data:abc" data-fancy-src="./image.jpg"></body></html>', {
      preprocess: ({ document }) => {
        const img = document.querySelector('img');
        img.setAttribute('src', img.getAttribute('data-fancy-src'));
        img.removeAttribute('data-fancy-src');
      },
    }, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><img src="https://www.sample.com/image.jpg"></body>');
    strictEqual(out.md.trim(), '![][image0]\n\n[image0]: https://www.sample.com/image.jpg');
  });

  it('html2md removes original hrs but keeps md section breaks', async () => {
    // hr from the source document are removed because they are meaningless
    // (understand: they do not match the markdown section break concept)
    // but hr added by the transformation are kept because they represent the sections breaks
    const out = await html2md('https://www.sample.com/hr.html', '<html><body><p>text 1</p><hr><p>text 2</p><hr><p>text 3</p><p>text 4</p></body></html>', {
      transformDOM: ({ document }) => {
        const p = document.querySelector('p:last-of-type');
        const hr = document.createElement('hr');
        p.after(hr);
        return document.body;
      },
    }, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><p>text 1</p><p>text 2</p><p>text 3</p><p>text 4</p><hr></body>');
    strictEqual(out.md.trim(), 'text 1\n\ntext 2\n\ntext 3\n\ntext 4\n\n---');
  });
});

describe('html2docx tests', () => {
  it('html2docx provides a default transformation', async () => {
    const out = await html2docx('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', null, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<body><h1>Hello World</h1></body>');
    strictEqual(out.md.trim(), '# Hello World');
    strictEqual(out.path, '/page');
    ok(out.docx);
    const md = await docx2md(out.docx, {
      mediaHandler: new MockMediaHandler(),
    });
    strictEqual(out.md, md);
  });

  it('html2docx handles a custom transformations', async () => {
    const out = await html2docx('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transformDOM: ({ document }) => {
        const p = document.createElement('p');
        p.innerHTML = 'My Hello to the World';
        return p;
      },
      generateDocumentPath: () => '/folder1/folder2/my-custom-path',
    }, {
      createDocumentFromString,
    });
    strictEqual(out.html.trim(), '<p>My Hello to the World</p>');
    strictEqual(out.md.trim(), 'My Hello to the World');
    strictEqual(out.path, '/folder1/folder2/my-custom-path');

    ok(out.docx);
    const md = await docx2md(out.docx, {
      mediaHandler: new MockMediaHandler(),
    });
    strictEqual(out.md, md);
  });
});
