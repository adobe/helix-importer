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
import path from 'path';
import fs from 'fs-extra';
import { dirname } from 'dirname-filename-esm';
import { strictEqual } from 'assert';
import { describe, it } from 'mocha';

import defaultTransformDOM from '../../../src/importer/defaults/transformDOM.js';
import TestUtils from '../../TestUtils.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(import.meta);

const { createDocumentFromString } = TestUtils;

describe('defaultTransformDOM tests', () => {
  const runTest = async (feature, config) => {
    const spec = await fs.readFile(path.resolve(__dirname, 'fixtures', `${feature}.input.html`), 'utf-8');
    const document = createDocumentFromString(spec);
    const out = await defaultTransformDOM({ document, ...config });
    const expected = await fs.readFile(path.resolve(__dirname, 'fixtures', `${feature}.expected.html`), 'utf-8');
    strictEqual(out.outerHTML.replace(/(?:\r\n|\r|\n|\s\s)/g, ''), expected.replace(/(?:\r\n|\r|\n|\s\s)/g, ''));
  };

  it('default transformation', async () => {
    await runTest('default');
  });

  it('default transformation handles basic metadata', async () => {
    await runTest('metadata.basic');
  });

  it('default transformation handles img and alt metadata', async () => {
    await runTest('metadata.image', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation handles identical metadata', async () => {
    await runTest('metadata.all.same', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation handles different metadata', async () => {
    await runTest('metadata.all.diff', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation handles falls back to og metadata', async () => {
    await runTest('metadata.og', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation handles falls back to twitter metadata', async () => {
    await runTest('metadata.twitter', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation removes non content elements', async () => {
    await runTest('cleanup');
  });

  it('default transformation adjusts image urls', async () => {
    await runTest('adjust-image-urls', {
      url: 'https://wwww.sample.com/path/page.html',
      params: {
        originalURL: 'https://wwww.currenthost.com/path/page.html',
      },
    });
  });

  it('default transformation converts icons', async () => {
    await runTest('icons', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });

  it('default transformation converts background-image styles into image element', async () => {
    await runTest('background-image', {
      url: 'https://wwww.sample.com/path/page.html',
    });
  });
});
