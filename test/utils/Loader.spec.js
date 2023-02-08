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

/* eslint-disable no-shadow */

import { rejects, doesNotReject } from 'assert';
import { describe, it } from 'mocha';

import { JSDOM } from 'jsdom';

import Loader from '../../src/utils/Loader.js';

describe('Loader#waitForElement', () => {
  it('should fail for non existing element', async () => {
    const { document } = (new JSDOM()).window;
    const div = document.createElement('div');
    document.body.appendChild(div);
    await rejects(async () => {
      await Loader.waitForElement('.dummy', document, 25, 20);
    });
  });

  it('should find existing element', async () => {
    const { document } = (new JSDOM()).window;
    const div = document.createElement('div');
    div.classList.add('dummy');
    document.body.appendChild(div);
    await doesNotReject(async () => {
      await Loader.waitForElement('.dummy', document, 100, 20);
    });
  });

  it('should wait for element to appear in the DOM', async () => {
    const { document } = (new JSDOM()).window;
    setTimeout(() => {
      const div = document.createElement('div');
      div.classList.add('dummy');
      document.body.appendChild(div);
    }, 50);
    await doesNotReject(async () => {
      await Loader.waitForElement('.dummy', document, 100, 20);
    });
  });
});
