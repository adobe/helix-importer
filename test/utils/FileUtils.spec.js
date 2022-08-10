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

import { strictEqual } from 'assert';
import { describe, it } from 'mocha';

import FileUtils from '../../src/utils/FileUtils.js';

describe('FileUtils tests', () => {
  it('FileUtils#sanitizeFilename empty', () => {
    strictEqual(FileUtils.sanitizeFilename(), '');
  });

  it('FileUtils#sanitizeFilename no change', () => {
    strictEqual(FileUtils.sanitizeFilename('simple'), 'simple');
    strictEqual(FileUtils.sanitizeFilename('with-dash-and-1-number'), 'with-dash-and-1-number');
  });

  it('FileUtils#sanitizeFilename sanitize', () => {
    strictEqual(FileUtils.sanitizeFilename('UPPERCASE---with spaces and%20encoded.dotalso_nounderscore'), 'uppercase-with-spaces-and-encoded-dotalso-nounderscore');
    strictEqual(FileUtils.sanitizeFilename('f@rbidd&n-®-25'), 'f-rbidd-n-25');
  });

  it('FileUtils#sanitizePath empty', () => {
    strictEqual(FileUtils.sanitizePath(), '');
  });

  it('FileUtils#sanitizePath no change', () => {
    strictEqual(FileUtils.sanitizePath('/should/be/valid/path'), '/should/be/valid/path');
    strictEqual(FileUtils.sanitizePath('/should/be/valid/path/with.extension'), '/should/be/valid/path/with.extension');
  });

  it('FileUtils#sanitizePath sanitize', () => {
    strictEqual(FileUtils.sanitizePath('//should/BE/1/p@Th/to%20sanitize/but.still.keep.extension'), '/should/be/1/p-th/to-sanitize/but-still-keep.extension');
  });
});
