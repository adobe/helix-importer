/*
 * Copyright 2010 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { strictEqual } from 'assert';
import { describe, it } from 'mocha';

import { JSDOM } from 'jsdom';

import Blocks from '../../src/utils/Blocks.js';

describe('Blocks#computeBlockName tests', () => {
  it('computeBlockName - can convert', () => {
    strictEqual(Blocks.computeBlockName('promotion'), 'Promotion');
    strictEqual(Blocks.computeBlockName('hero-animation'), 'Hero Animation');
    strictEqual(Blocks.computeBlockName('how-to-carousel'), 'How To Carousel');
  });
});

const trim = (html) => html
  .replace(/^\s*/gm, '')
  .replace(/\s*$/gm, '')
  .replace(/\n/gm, '')
  .replace(/\/>\s*</gm, '/><');

describe('Blocks#convertBlocksToTables tests', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    Blocks.convertBlocksToTables(document, document);
    strictEqual(trim(document.body.innerHTML), trim(expected));
  };

  const div = '<div></div>'; // ignored div for the tests

  it('convertBlocksToTables basic block', () => {
    test(
      `<main>${div}${div}${div}
        <div>
          <div class="a-block">
            <div>cell11</div>
            <div>cell21</div>
          </div>
        </div>
      </main>`,
      `<main>${div}${div}${div}
        <div>
          <table>
            <tr><th>A Block</th></tr>
            <tr><td>cell11</td></tr>
            <tr><td>cell21</td></tr>
          </table>
        </div>
      </main>`,
    );
    test(
      `<main>${div}${div}${div}
        <div>
          <div class="another-block">
            <div>
              <div>cell11</div>
              <div>cell12</div>
            </div>
            <div>
              <div>cell21</div>
              <div>cell22</div>
            </div>
            <div>
              <div><img src="https://www.sample.com/image.jpeg"></div>
              <div><a href="https://www.sample.com/">A link</a></div>
            </div>
          </div>
        </div>
      </main>`,
      `<main>${div}${div}${div}
        <div>
          <table>
            <tr><th colspan="2">Another Block</th></tr>
            <tr><td>cell11</td><td>cell12</td></tr>
            <tr><td>cell21</td><td>cell22</td></tr>
            <tr><td><img src="https://www.sample.com/image.jpeg"></td><td><a href="https://www.sample.com/">A link</a></td></tr>
          </table>
        </div>
      </main>`,
    );
    test(
      `<main>${div}${div}${div}
        <div>
        <div class="promotion">
          <div>
            <div><a href="https://blog.adobe.com/en/promotions/doc-cloud-education.html">https://blog.adobe.com/en/promotions/doc-cloud-education.html</a></div>
            <div><span>with content</span></div>
          </div>
        </div>
      </main>`,
      `<main>${div}${div}${div}
        <div>
          <table>
            <tr><th colspan="2">Promotion</th></tr>
            <tr>
              <td><a href="https://blog.adobe.com/en/promotions/doc-cloud-education.html">https://blog.adobe.com/en/promotions/doc-cloud-education.html</a></td>
              <td><span>with content</span></td>
            </tr>
          </table>
        </div>
      </main>`,
    );
  });
});

describe('Blocks#getMetadataBlock tests', () => {
  const test = (metadata, expected) => {
    const { document } = (new JSDOM()).window;
    const table = Blocks.getMetadataBlock(document, metadata);
    strictEqual(trim(table.outerHTML), trim(expected));
  };

  it('getMetadataBlock string meta', () => {
    test({ title: 'Some title' }, '<table><tr><th colspan="2">Metadata</th></tr><tr><td>title</td><td>Some title</td></tr></table>');
    test({ Author: 'Name of the author', 'Creation Date': '2022/01/01' }, '<table><tr><th colspan="2">Metadata</th></tr><tr><td>Author</td><td>Name of the author</td></tr><tr><td>Creation Date</td><td>2022/01/01</td></tr></table>');
  });

  it('getMetadataBlock element meta', () => {
    const { document } = (new JSDOM()).window;
    const img = document.createElement('img');
    img.src = 'https://www.sample.com/image.jpeg';
    img.title = 'Image title';
    img.alt = 'Image alt';
    test({ title: 'Some title', Image: img }, '<table><tr><th colspan="2">Metadata</th></tr><tr><td>title</td><td>Some title</td></tr><tr><td>Image</td><td><img src="https://www.sample.com/image.jpeg" title="Image title" alt="Image alt"></td></tr></table>');
  });

  it('getMetadataBlock lists', () => {
    test({ title: 'Some title', Tags: ['Creative', 'Experience Cloud', 'Photography'] }, '<table><tr><th colspan="2">Metadata</th></tr><tr><td>title</td><td>Some title</td></tr><tr><td>Tags</td><td><p>Creative</p><p>Experience Cloud</p><p>Photography</p></td></tr></table>');
  });
});
