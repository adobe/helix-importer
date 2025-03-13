/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { describe, it, beforeEach } from 'mocha';
import { JSDOM } from 'jsdom';
import { strictEqual } from 'assert';
import convertIcons from '../../../../src/importer/defaults/rules/convertIcons.js';

describe('convertIcons tests', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <main>
            <img src="icon1.svg" />
            <img src="/path/icon2.svg" />
          </main>
        </body>
      </html>
    `);
  });

  // expect that images that do not end in svg are not converted
  it('do not convert non-svg img', async () => {
    dom = new JSDOM(`
      <html>
        <body>
          <main>
            <img src="icon1.jpg" alt=""/>
            <img src="icon1.svg" alt=""/>
          </main>
        </body>
      </html>
    `);

    const { document } = dom.window;
    const main = document.querySelector('main');

    convertIcons(main, document);

    const spans = main.querySelectorAll('span');
    strictEqual(spans.length, 1);

    const imgs = main.querySelectorAll('img');
    strictEqual(imgs.length, 1);
  });

  it('convert svg img to :format:', async () => {
    const expected = [':icon1:', ':icon2:'];

    const { document } = dom.window;
    const main = document.querySelector('main');

    convertIcons(main, document);

    const spans = main.querySelectorAll('span');
    spans.forEach((span) => {
      strictEqual(span.textContent, expected.shift());
    });
  });

  it('callback', async () => {
    const expected = ['icon1.svg', '/path/icon2.svg'];

    const { document } = dom.window;
    const main = document.querySelector('main');

    const callback = (src) => {
      strictEqual(src, expected.shift());
    };

    convertIcons(main, document, callback);
  });

  it('verify character replacement', async () => {
    const expected = [':icon1:', ':icon2:', ':icon3:', ':icon-4:', ':icon-5:', ':icon---6:', ':-:', ':--:'];

    dom = new JSDOM(`
      <html>
        <body>
          <main>
            <img src="icon1.svg" alt=""/>
            <img src="/path/icon2.svg" alt=""/>
            <img src="ICON3.svg" alt=""/>
            <img src="ICON 4.svg" alt=""/>
            <img src="ICON%5.svg" alt=""/>
            <img src="icon & 6.svg" alt=""/>
            <img src="%.svg" />
            <img src="%&.svg" />
          </main>
        </body>
      </html>
    `);

    const { document } = dom.window;
    const main = document.querySelector('main');

    convertIcons(main, document);

    const spans = main.querySelectorAll('span');
    spans.forEach((span) => {
      strictEqual(span.textContent, expected.shift());
    });
  });
});
