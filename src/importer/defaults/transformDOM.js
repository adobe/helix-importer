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
import Blocks from '../../utils/Blocks.js';
import DOMUtils from '../../utils/DOMUtils.js';

function getMetadata(name, document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = getMetadata('description', document) || getMetadata('og:description', document);
  if (desc) {
    meta.Description = desc;
  }

  const img = getMetadata('og:image', document);
  if (img) {
    const el = document.createElement('img');
    el.src = img;
    meta.Image = el;

    const imgAlt = getMetadata('og:image:alt', document);
    if (imgAlt) {
      el.alt = imgAlt;
    }
  }

  if (Object.keys(meta).length > 0) {
    const block = Blocks.getMetadataBlock(document, meta);
    main.append(block);
  }

  return meta;
};

export default async function transformDOM({
  // eslint-disable-next-line no-unused-vars
  url, document, html, params,
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
  ]);

  createMetadata(main, document);

  return main;
}
