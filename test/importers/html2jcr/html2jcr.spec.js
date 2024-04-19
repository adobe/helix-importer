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
import { html2jcr } from '../../../src/importer/html2jcr/index.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsModels = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-models.json'), 'utf-8');
const componentsDefinition = await fs.readFile(path.resolve(__dirname, 'fixtures', 'components-definition.json'), 'utf-8');
const componentFilters = await fs.readFile(path.resolve(__dirname, 'fixtures', 'component-filters.json'), 'utf-8');

async function test(spec) {
  const html = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.html`), 'utf-8');
  let xmlExpected = html;
  try {
    xmlExpected = await fs.readFile(path.resolve(__dirname, 'fixtures', `${spec}.expected.xml`), 'utf-8');
  } catch (e) {
    // ignore
  }
  const actual = await html2jcr(html, {
    componentModels: JSON.parse(componentsModels),
    componentDefinition: JSON.parse(componentsDefinition),
    filters: JSON.parse(componentFilters),
  });
  assert.strictEqual(actual, xmlExpected);
}

describe('HTML to JCR converter', () => {
  it('converts a simple default content text', async () => {
    await test('text-simple');
  });

  it('converts a default content text with siblings', async () => {
    await test('text-siblings');
  });

  it('converts a default content image', async () => {
    await test('image');
  });

  it('converts a default content headlines', async () => {
    await test('headline');
  });

  it('converts a column block', async () => {
    await test('columns');
  });

  it('converts a generic block', async () => {
    await test('block');
  });

  it('converts a block with field collapsing', async () => {
    await test('block-field-collapsing');
  });

  it('converts a block with element grouping', async () => {
    await test('block-element-grouping');
  });

  it('converts a section', async () => {
    await test('section');
  });

  it('converts buttons', async () => {
    await test('button');
  });
});
