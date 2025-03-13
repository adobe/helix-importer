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

/**
 * This function searches for all `img` elements within the `main` element that have a source
 * ending with `.svg`. It then replaces each of these `img` elements with a `span` element
 * containing the name of the SVG file in the :<name>: format. The name is derived from the
 * filename of the SVG, converted to lowercase, trimmed, and non-alphanumeric characters
 * are replaced with hyphens.
 *
 * @param {HTMLElement} main - The main element containing the `img` elements to be converted.
 * @param {Document} document - The document object used to create new elements.
 * @param {Function} callback - An optional callback function that is invoked with the original
 * src of each converted SVG image and the name of the icon, when the conversion is complete.
 */
export default function convertIcons(main, document, callback = undefined) {
  [...main.querySelectorAll('img')].forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.endsWith('.svg')) {
      const span = document.createElement('span');
      const name = src.split('/').pop().split('.')[0].toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      if (name) {
        span.innerHTML = `:${name}:`;
        img.replaceWith(span);

        if (callback && typeof callback === 'function') {
          callback(src, name);
        }
      }
    }
  });
}
