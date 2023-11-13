/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import DOMUtils from '../utils/DOMUtils.js';

export default class WPUtils {
  static handleCaptions(document) {
    DOMUtils.replaceByCaptions(document, ['.wp-caption-text', 'figcaption']);

    // an h5 following an image / video is a caption
    document.querySelectorAll('p img, video').forEach((item) => {
      if (
        (item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5')
        || (item.nextElementSibling && item.nextElementSibling.tagName === 'H5')
      ) {
        const elem = item.parentNode.nextElementSibling && item.parentNode.nextElementSibling.tagName === 'H5'
          ? item.parentNode.nextElementSibling
          : item.nextElementSibling;
        const captionText = elem.textContent.trim();
        elem.parentNode.insertBefore(DOMUtils.fragment(document, `<p><em>${captionText}</em><p>`), elem);
        elem.remove();
      }
    });
  }

  static genericDOMCleanup(document) {
    // extract "emphasis" from links
    // see https://github.com/adobe/helix-pipeline/issues/895
    document.querySelectorAll('a strong').forEach((elem) => {
      const parent = elem.parentNode;
      if (parent.childNodes.length === 1) {
        // only cover case with 1 child
        const txt = elem.textContent;
        // only treat links
        if (txt && (txt.indexOf('.') !== -1 || txt.indexOf(':') !== -1)) {
          // eslint-disable-next-line no-param-reassign
          elem.innerHTML = '';
          // take out of parent
          parent.parentNode.insertBefore(elem, parent.nextSibling);
          elem.appendChild(parent);
          parent.innerHTML = txt;
        }
      }
    });

    // some images are in headings...
    document.querySelectorAll('h1 img, h2 img, h3 img, h4 img, h5 img, h6 img').forEach((img) => {
      // move image after its parent heading
      img.parentNode.parentNode.insertBefore(img, img.parentNode.nextSibling);
    });

    // heading could be full of tags
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      // eslint-disable-next-line no-param-reassign
      h.innerHTML = h.textContent;
    });
  }
}
