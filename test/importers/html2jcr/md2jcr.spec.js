/*
 * Copyright 2024 Adobe. All rights reserved.
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
import fs from 'node:fs/promises';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { describe, it } from 'mocha';
import { md2jcr } from '../../../src/importer/html2jcr/index.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsModels = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-models.json'), 'utf-8');
const componentsDefinition = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-definition.json'), 'utf-8');
const componentFilters = await fs.readFile(path.resolve(__dirname, 'fixtures', 'component-filters.json'), 'utf-8');

async function test(spec) {
  const md = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.md`), 'utf-8');
  let xmlExpected = md;
  try {
    xmlExpected = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.expected.xml`), 'utf-8');
  } catch (e) {
    // ignore
  }
  const actual = await md2jcr(md, {
    componentModels: JSON.parse(componentsModels),
    componentDefinition: JSON.parse(componentsDefinition),
    filters: JSON.parse(componentFilters),
  });
  assert.strictEqual(actual, xmlExpected);
}

describe('MD to JCR converter', () => {
  it('converts a content text with list items', async () => {
    await test('text-list');
  });
  it('converts a text with page metadata', async () => {
    await test('metadata');
  });
  it('converts a block with key-value pairs', async () => {
    await test('key-value');
  });
  it('converts a block with code', async () => {
    await test('code');
  });
});
