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

import defaultGenerateDocumentPath from '../../../src/importer/defaults/generateDocumentPath.js';

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
