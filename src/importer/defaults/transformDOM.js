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
import DOMUtils from '../../utils/DOMUtils.js';
import createMetadata from './rules/createMetadata.js';
import adjustImageUrls from './rules/adjustImageUrls.js';
import convertIcons from './rules/convertIcons.js';
import transformBackgroundImages from './rules/transformBackgroundImages.js';

export default async function transformDOM({
  // eslint-disable-next-line no-unused-vars
  url, document, html, params = {},
}) {
  const main = document.body;

  // attempt to remove non-content elements
  DOMUtils.remove(main, [
    'header',
    '.header',
    'nav',
    '.nav',
    'footer',
    '.footer',
    'iframe',
    'noscript',
  ]);

  createMetadata(main, document);
  transformBackgroundImages(main, document);
  adjustImageUrls(main, url, params.originalURL);
  convertIcons(main, document);

  return main;
}
