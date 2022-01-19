/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable max-classes-per-file, class-methods-use-this */

import { strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';
import { Response } from 'node-fetch';

import { docx2md } from '@adobe/helix-docx2md';

import PageImporter from '../../src/importer/PageImporter.js';
import PageImporterResource from '../../src/importer/PageImporterResource.js';
import MemoryHandler from '../../src/storage/MemoryHandler.js';

import MockMediaHandler from '../mocks/MockMediaHandler.js';
import NoopLogger from '../mocks/NoopLogger.js';

const logger = new NoopLogger();

describe('PageImporter tests', () => {
  const storageHandler = new MemoryHandler(logger);
  const config = {
    storageHandler,
    logger,
  };

  it('import - do nothing', async () => {
    class TestImporter extends PageImporter {
      async fetch() {
        return new Response('test');
      }
    }

    const se = new TestImporter(config);
    const results = await se.import('someurl');

    strictEqual(results.length, 0, 'expect no result');
  });
});

describe('PageImporter tests - various options', () => {
  class Test extends PageImporter {
    async fetch() {
      return new Response('<html><body><h1>heading1</h1><p>paragraph</p><div class="useless"></div></body></html>');
    }

    async process(document, url) {
      const pir = new PageImporterResource('resource1', `${url}/somecomputedpath`, document.body, null, null);
      return [pir];
    }
  }

  it('import - basic', async () => {
    const storageHandler = new MemoryHandler(logger);
    const config = {
      storageHandler,
      logger,
    };
    const se = new Test(config);
    const results = await se.import('/someurl');

    strictEqual(results.length, 1, 'expect no result');

    ok(await storageHandler.exists('/someurl/somecomputedpath/resource1.md'), 'md has been stored');
    ok(await storageHandler.exists('/someurl/somecomputedpath/resource1.docx'), 'docx has been stored');

    const md = await storageHandler.get('/someurl/somecomputedpath/resource1.md');
    strictEqual(md, '# heading1\n\nparagraph\n', 'valid markdown created');

    const docx = await storageHandler.get('/someurl/somecomputedpath/resource1.docx');
    const test = await docx2md(docx, {
      mediaHandler: new MockMediaHandler(),
    });
    strictEqual(md, test, 'valid backward conversion');
  });
});
