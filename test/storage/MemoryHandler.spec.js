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

import { strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';

import MemoryHandler from '../../src/storage/MemoryHandler.js';

describe('MemoryHandler tests', () => {
  it('get/put content', async () => {
    const handler = new MemoryHandler();
    handler.put('somepath', 'somecontent');

    const content = await handler.get('somepath');
    strictEqual(content, 'somecontent');
  });

  it('content exist / does not exist', async () => {
    const handler = new MemoryHandler();
    handler.put('somepath', 'somecontent');
    ok((await handler.exists('somepath')));
    ok(!(await handler.exists('somepath_doesnotexist')));
  });
});
