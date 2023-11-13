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
/* eslint-env mocha */
/* global Document, HTMLElement */

import { expect } from '@esm-bundle/chai';
import BrowserUtils from '../../src/utils/BrowserUtils.js';

describe('BrowserUtils#createDocumentFromString', () => {
  it('createDocumentFromString can parse a simple string', () => {
    const document = BrowserUtils.createDocumentFromString('<html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>');
    expect(document).to.be.an.instanceof(Document);
    expect(document.documentElement).to.be.an.instanceof(HTMLElement);

    const title = document.querySelector('title');
    expect(title).to.be.an.instanceof(HTMLElement);
    expect(title.textContent).to.equal('Test');

    const h1 = document.querySelector('h1');
    expect(h1).to.be.an.instanceof(HTMLElement);
    expect(h1.textContent).to.equal('Hello World');
  });

  it('createDocumentFromString can parse a non document string', () => {
    const document = BrowserUtils.createDocumentFromString('<h1>Hello World</h1>');
    expect(document).to.be.an.instanceof(Document);
    expect(document.documentElement).to.be.an.instanceof(HTMLElement);

    const h1 = document.querySelector('h1');
    expect(h1).to.be.an.instanceof(HTMLElement);
    expect(h1.textContent).to.equal('Hello World');
  });
});
