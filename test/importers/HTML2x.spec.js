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

import { ok, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { JSDOM } from 'jsdom';
import { docx2md } from '@adobe/helix-docx2md';
import MockMediaHandler from '../mocks/MockMediaHandler.js';

import DOMUtils from '../../src/utils/DOMUtils.js';
import {
  html2md,
  html2docx,
  defaultGenerateDocumentPath,
  defaultTransformDOM,
} from '../../src/importer/HTML2x.js';

describe('defaultTransformDOM tests', () => {
  it('default transformation', async () => {
    const { document } = new JSDOM('<html><body><h1>Hello World</h1></body></html>', { runScripts: undefined }).window;
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><h1>Hello World</h1></body>');
  });
});

describe('defaultGenerateDocumentPath tests', () => {
  it('default paths', async () => {
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com' }), '/index');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/' }), '/index');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/index.html' }), '/index');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/index' }), '/index');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/page' }), '/page');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/page.html' }), '/page');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/folder/page' }), '/folder/page');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/folder/page.html' }), '/folder/page');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/folder/page/' }), '/folder/page/index');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/folder/page with spaces.html' }), '/folder/page-with-spaces');
    strictEqual(await defaultGenerateDocumentPath({ url: 'https://wwww.sample.com/folder/PagE_with_3xtr4_charactére.html' }), '/folder/page-with-3xtr4-charact-re');
  });
});

describe('html2md tests', () => {
  it('html2md provides a default transformation', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>');
    strictEqual(out.html.trim(), '<body><h1>Hello World</h1></body>');
    strictEqual(out.md.trim(), '# Hello World');
    strictEqual(out.path, '/page');
  });

  it('html2md handles a custom transformations', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transformDOM: ({ document }) => {
        const p = document.createElement('p');
        p.innerHTML = 'My Hello to the World';
        return p;
      },
      generateDocumentPath: () => '/folder/my-custom-path',
    });
    strictEqual(out.html.trim(), '<p>My Hello to the World</p>');
    strictEqual(out.md.trim(), 'My Hello to the World');
    strictEqual(out.path, '/folder/my-custom-path');
  });

  it('html2md can deal with null returning transformation', async () => {
    const out = await html2md('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>', {
      transformDOM: () => null,
      generateDocumentPath: () => null,
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
    );
    strictEqual(out.html.trim(), '<body><img src="./image.png"></body>');
  });
});

describe('html2docx tests', () => {
  it('html2docx provides a default transformation', async () => {
    const out = await html2docx('https://www.sample.com/page.html', '<html><body><h1>Hello World</h1></body></html>');
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
