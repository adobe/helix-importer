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
import { h } from 'hastscript';
import { matchStructure, hasSingleChildElement, encodeHTMLEntities } from '../utils.js';

const resourceType = 'core/franklin/components/button/v1/button';

export function getType(node) {
  if (matchStructure(node, h('p', [h('strong', [h('a')])]))) {
    return 'primary';
  }
  if (matchStructure(node, h('p', [h('em', [h('a')])]))) {
    return 'secondary';
  }
  return undefined;
}

function removeExtension(href) {
  if (!href.startsWith('http')) {
    return href.replace(/\.html$/, '');
  }
  return href;
}

function getLink(node) {
  const [buttonNode] = node.children;
  if (!buttonNode || !buttonNode.properties) {
    return { href: '', text: '', title: '' };
  }
  if (getType(node)) {
    const { href, title } = buttonNode.children[0].properties;
    const text = buttonNode.children[0]?.children[0]?.value;
    return { href: encodeHTMLEntities(removeExtension(href)), text, title };
  }
  const { href = '', title = '' } = buttonNode.properties;
  const text = buttonNode.children[0]?.value || '';
  return { href: encodeHTMLEntities(removeExtension(href)), text, title };
}

const button = {
  use: (node) => {
    if (node?.tagName === 'p') {
      if (hasSingleChildElement(node)) {
        // a paragraph is a button with a single link only
        // a paragraph is a button with strong or em tag with a single link only
        if (node.children[0].tagName === 'em' || node.children[0].tagName === 'strong') {
          if (node.children[0].children.length === 1 && node.children[0].children[0].tagName === 'a') {
            return true;
          }
        }

        if (matchStructure(node, h('p', [h('a')]))) {
          return true;
        }
      }
    }
    if (node?.tagName === 'a') return true;
    return false;
  },
  getAttributes: (node) => {
    const type = getType(node);
    const { href, text, title } = getLink(node);
    return {
      rt: resourceType,
      type,
      href,
      text,
      title,
    };
  },
  leaf: true,
};

export default button;
