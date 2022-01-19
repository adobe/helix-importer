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

import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';

import os from 'os';

import CSV from '../../src/utils/CSV.js';

describe('CSV tests', () => {
  it('CSV#toCSV empty', () => {
    strictEqual(CSV.toCSV([]), '');
  });

  it('CSV#toCSV conversion', () => {
    strictEqual(CSV.toCSV([{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]), `a;b;${os.EOL}a1;b1;${os.EOL}a2;b2;${os.EOL}`);
  });

  it('CSV#toCSV conversion - skip headers', () => {
    strictEqual(CSV.toCSV([{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }], ';', true), `a1;b1;${os.EOL}a2;b2;${os.EOL}`);
  });

  it('CSV#toCSV missing properties', () => {
    strictEqual(CSV.toCSV([{ a: 'a1', b: 'b1' }, { b: 'b2' }]), `a;b;${os.EOL}a1;b1;${os.EOL};b2;${os.EOL}`);
  });

  it('CSV#toArray empty', () => {
    deepStrictEqual(CSV.toArray(''), []);
  });

  it('CSV#toArray missing properties', () => {
    deepStrictEqual(CSV.toArray(`a;b;${os.EOL}a1;b1;${os.EOL}a2;;${os.EOL}`), [{ a: 'a1', b: 'b1' }, { a: 'a2', b: '' }]);
  });

  it('CSV#toArray no trailing semi-column in header', () => {
    deepStrictEqual(CSV.toArray(`a;b${os.EOL}a1;b1;${os.EOL}a2;b2;${os.EOL}`), [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]);
  });

  it('CSV#toArray no trailing semi-column in one row', () => {
    deepStrictEqual(CSV.toArray(`a;b;${os.EOL}a1;b1;${os.EOL}a2;b2${os.EOL}`), [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]);
  });

  it('CSV#toArray no trailing semi-column at all', () => {
    deepStrictEqual(CSV.toArray(`a;b${os.EOL}a1;b1${os.EOL}a2;b2${os.EOL}`), [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]);
  });

  it('CSV#toArray no trailing EOL', () => {
    deepStrictEqual(CSV.toArray(`a;b${os.EOL}a1;b1;${os.EOL}a2;b2;`), [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]);
  });
});
