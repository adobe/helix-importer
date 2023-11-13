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
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import BrowserUtils from '../../src/utils/BrowserUtils.js';
import DOMUtils from '../../src/utils/DOMUtils.js';

const createElement = (document, tag, attrs, styles, innerHTML) => {
  const element = document.createElement(tag);
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const a in attrs) {
    element.setAttribute(a, attrs[a]);
  }
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const p in styles) {
    element.style[p] = styles[p];
  }
  element.innerHTML = innerHTML;
  return element;
};

describe('DOMUtils#element', () => {
  const test = (tag, attrs, styles, innerHTML, expected) => {
    const document = BrowserUtils.createDocumentFromString('<html><body></body></html>');
    const element = createElement(document, tag, attrs, styles, innerHTML);
    const ret = DOMUtils.getImgFromBackground(element, document);
    if (expected) {
      expect(ret).to.not.be.null;
      expect(ret.outerHTML).to.equal(expected);
    } else {
      expect(ret).to.be.null;
    }
  };

  it('no background-image style', () => {
    test('p', {}, {}, 'Some content', null);
    test('img', { src: 'https://www.server.com/image.jpg', title: 'Some title' }, {}, '', null);
    test('p', {}, { 'background-image': 'none' }, 'Some content', null);
  });

  it('with background-image style', () => {
    test('p', {}, { 'background-image': 'url(https://www.server.com/image.jpg)' }, 'Some content', '<img src="https://www.server.com/image.jpg">');
    test('p', {}, { 'background-image': 'url("https://www.server.com/image.jpg")' }, 'Some content', '<img src="https://www.server.com/image.jpg">');
    test('p', {}, { 'background-image': 'url(\'https://www.server.com/image.jpg\')' }, 'Some content', '<img src="https://www.server.com/image.jpg">');
    test('p', {}, { 'background-image': 'url(http://localhost:3001/image.jpg)' }, 'Some content', '<img src="http://localhost:3001/image.jpg">');
  });

  // `createElement` uses JSDOM to create the test-DOM
  // the workaround in DOMUtils#getImgFromBackground exists _precisely_
  // because of a potential bug in JSDOM due to which it doesn't
  // parse `url()` with whitespaces correctly
  // browser specific version of the test
  it('with background-image style containing whitespace in url()', () => {
    test('p', {}, { 'background-image': 'url( /image.jpg )' }, 'Some content', '<img src="/image.jpg">');
  });
});
