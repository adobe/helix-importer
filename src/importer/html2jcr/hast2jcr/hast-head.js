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

import { selectAll, select } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { remove } from 'unist-util-remove';
import { h } from 'hastscript';
import { toMetaName, childNodes } from './utils.js';

function appendElement($parent, $el) {
  if ($el) {
    $parent.children.push($el);
  }
}

function createElement(name, ...attrs) {
  // check for empty values
  const properties = {};
  for (let i = 0; i < attrs.length; i += 2) {
    const value = attrs[i + 1];
    if (value === undefined) {
      return null;
    }
    properties[attrs[i]] = value;
  }
  return h(name, properties);
}

function readBlockConfig($block) {
  const config = Object.create(null);
  selectAll(':scope>div', $block).forEach(($row) => {
    if ($row?.children[1]) {
      const [$name, $value] = $row.children;
      const name = toMetaName(toString($name));
      if (name) {
        let value;
        const $firstChild = childNodes($value)[0];
        if ($firstChild) {
          let list;
          const { tagName } = $firstChild;
          if (tagName === 'p') {
            list = childNodes($value);
          } else if (tagName === 'ul' || tagName === 'ol') {
            list = childNodes($firstChild);
          }

          if (list) {
            value = list.map((child) => toString(child)).join(', ');
          }
        }

        if (!value) {
          value = toString($value).trim().replace(/ {3}/g, ',');
        }

        if (!value) {
          const $a = select('a', $value);
          if ($a) {
            value = $a.properties.href;
          }
        }
        if (!value) {
          const $img = select('img', $value);
          if ($img) {
            value = $img.properties.src;
          }
        }
        config[name] = value;
      }
    }
  });
  return config;
}

function getMetadata(hast) {
  let metaConfig = {};
  const metaBlock = select('div.metadata', hast);
  if (metaBlock) {
    metaConfig = readBlockConfig(metaBlock);
    remove(hast, { cascade: false }, metaBlock);
  }
  return metaConfig;
}

export default function createHead({ content }) {
  const { hast } = content;
  const meta = getMetadata(hast);
  const $head = h('head');
  if (meta.title !== undefined) {
    $head.children.push(h('title', meta.title));
    delete meta.title;
  }
  for (const [name, value] of Object.entries(meta)) {
    const attr = name.includes(':') && !name.startsWith('twitter:') ? 'property' : 'name';
    if (Array.isArray(value)) {
      for (const v of value) {
        appendElement($head, createElement('meta', attr, name, 'content', v));
      }
    } else {
      appendElement($head, createElement('meta', attr, name, 'content', value));
    }
  }
  return $head;
}
