/*
 * Copyright 2023 Adobe. All rights reserved.
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

import defaultTransformDOM from '../../../src/importer/defaults/transformDOM.js';
import TestUtils from '../../TestUtils.js';

const { createDocumentFromString } = TestUtils;

describe.only('defaultTransformDOM tests', () => {
  it('default transformation', async () => {
    const document = createDocumentFromString('<html><body><h1>Hello World</h1></body></html>');
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><h1>Hello World</h1></body>');
  });

  it('default transformation handles basic metadata', async () => {
    const document = createDocumentFromString('<html><head><title>Page title</title><meta name="description" content="Page description"></head><body><h1>Hello World</h1></body></html>');
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><h1>Hello World</h1><table><tr><th colspan="2">Metadata</th></tr><tr><td>Title</td><td>Page title</td></tr><tr><td>Description</td><td>Page description</td></tr></table></body>');
  });

  it('default transformation handles img metadata', async () => {
    const document = createDocumentFromString('<html><head><meta property="og:image" content="/img.png"></head><body><h1>Hello World</h1></body></html>');
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><h1>Hello World</h1><table><tr><th colspan="2">Metadata</th></tr><tr><td>Image</td><td><img src="/img.png"></td></tr></table></body>');
  });

  it('default transformation handles img and alt metadata', async () => {
    const document = createDocumentFromString('<html><head><meta property="og:image" content="/img.png"><meta property="og:image:alt" content="This is the image alt text"></head><body><h1>Hello World</h1></body></html>');
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><h1>Hello World</h1><table><tr><th colspan="2">Metadata</th></tr><tr><td>Image</td><td><img src="/img.png" alt="This is the image alt text"></td></tr></table></body>');
  });

  it('default transformation removes non content elements', async () => {
    const document = createDocumentFromString('<html><body><header>Top header</header><nav>Nav might be here</nav><main><h1>Hello World</h1><iframe src="iframe.html"></iframe></main><footer>Bottom footer</footer></body></html>');
    const out = await defaultTransformDOM({ document });
    strictEqual(out.outerHTML, '<body><main><h1>Hello World</h1></main></body>');
  });
});
