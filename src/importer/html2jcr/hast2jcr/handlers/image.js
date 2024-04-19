/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { select } from 'unist-util-select';
import { h } from 'hastscript';
import { encodeHTMLEntities, hasSingleChildElement, matchStructure } from '../utils.js';

const resourceType = 'core/franklin/components/image/v1/image';

function getImage(node) {
  const $image = select('element[tagName=img]', node);
  const { alt, src } = $image.properties;
  return {
    alt: encodeHTMLEntities(alt),
    src: encodeHTMLEntities(src),
  };
}

const image = {
  use: (node) => {
    if (node.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        if (matchStructure(node, h('p', [h('picture', [h('img')])]))
          || matchStructure(node, h('p', [h('img')]))) {
          return true;
        }
      }
    }
    return false;
  },
  getAttributes: (node) => {
    const { alt, src: fileReference } = getImage(node);
    return {
      rt: resourceType,
      alt,
      fileReference,
    };
  },
};

export default image;
