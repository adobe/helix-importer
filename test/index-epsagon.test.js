/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
const proxyquire = require('proxyquire');
const assert = require('assert');

// count how many time espagon was run.
let epsagonified = 0;

const index = proxyquire('../src/index.js', {
  epsagon: {
    openWhiskWrapper(action) {
      return (params) => {
        epsagonified += 1;
        return action(params);
      };
    },
    '@global': true,
  },
}).main;

describe('Index Epsagon Tests', () => {
  it('index function w/o token does not instrument epsagon', async () => {
    const expected = epsagonified;
    await index({});
    assert.equal(expected, epsagonified, 'epsagon not instrumented');
  });

  it('index function instruments epsagon', async () => {
    const expected = epsagonified + 1;
    await index({
      EPSAGON_TOKEN: 'foobar',
    });
    assert.equal(expected, epsagonified, 'epsagon instrumented');
  });

  it('index function runs epsagon once for each invocation', async () => {
    const expected = epsagonified + 2;
    await index({
      EPSAGON_TOKEN: 'foobar',
    });
    await index({
      EPSAGON_TOKEN: 'foobar',
    });
    assert.equal(expected, epsagonified, 'epsagon instrumented');
  });
});
