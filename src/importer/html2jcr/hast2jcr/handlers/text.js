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
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import {
  hasSingleChildElement, encodeHTMLEntities, insertComponent, matchStructure,
} from '../utils.js';

const resourceType = 'core/franklin/components/text/v1/text';

function isCollapsible(element) {
  const { attributes = {} } = element;
  return attributes['sling:resourceType'] === resourceType;
}

function getRichText(node) {
  const richText = toHtml(node);
  return encodeHTMLEntities(richText);
}

function isList(node) {
  return node?.tagName === 'ul' || node.tagName === 'ol';
}

function isCode(node) {
  return node?.tagName === 'pre';
}

function isBlockquote(node) {
  return node?.tagName === 'blockquote';
}

const text = {
  use: (node) => {
    // Ignore paragraphs that only contain a single button or single image
    if (node?.tagName === 'p' || isList(node) || isBlockquote(node) || isCode(node)) {
      if (hasSingleChildElement(node)) {
        if (node.children[0].tagName === 'em' || node.children[0].tagName === 'strong') {
          if (node.children[0].children.length === 1 && node.children[0].children[0].tagName === 'a') {
            return false;
          }
        }

        if (matchStructure(node, h('p', [h('a')]))) {
          return false;
        }
        if (matchStructure(node, h('p', [h('picture', [h('img')])]))
          || matchStructure(node, h('p', [h('img')]))) {
          return false;
        }
      }
      return true;
    }
    return false;
  },
  getAttributes: (node) => ({
    rt: resourceType,
    text: getRichText(node),
  }),
  insert: (parent, nodeName, component) => {
    const elements = parent.elements || [];
    const previousSibling = elements.at(-1);
    if (previousSibling && isCollapsible(previousSibling)) {
      previousSibling.attributes.text += component.text;
    } else {
      insertComponent(parent, nodeName, component);
    }
  },
  leaf: true,
};

export default text;
