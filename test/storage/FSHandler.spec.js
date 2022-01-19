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

/* global beforeEach, afterEach */

import mockfs from 'mock-fs';

import { strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';

import FSHandler from '../../src/storage/FSHandler.js';

describe('FSHandler tests', () => {
  beforeEach(() => {
    mockfs({
      'tmp/path/to/fake/dir': {
        'some-file.txt': 'file content here',
      },
    });
  });

  afterEach(() => {
    mockfs.restore();
  });

  it('get a file', async () => {
    const handler = new FSHandler('tmp', console);
    const content = await handler.get('path/to/fake/dir/some-file.txt');
    strictEqual(content.toString(), 'file content here');
  });

  it('a file exsits', async () => {
    const handler = new FSHandler('tmp', console);
    ok(await handler.exists('path/to/fake/dir/some-file.txt'));
  });

  it('put a file', async () => {
    const handler = new FSHandler('tmp', console);
    await handler.put('path/to/fake/dir/some-other-file.txt', 'this is a new file');
    const content = await handler.get('path/to/fake/dir/some-other-file.txt');
    strictEqual(content.toString(), 'this is a new file');
  });
});
