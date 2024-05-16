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
import DOMUtils from './DOMUtils.js';

function getDocumentMetadata(name, document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

export default class Blocks {
  static createBlock(document, { name, variants = [], cells: data }) {
    const headerRow = variants.length ? [`${Blocks.computeBlockName(name)} (${variants.join(', ')})`] : [Blocks.computeBlockName(name)];
    let blockRows = data;
    if (!Array.isArray(data)) {
      blockRows = Object.entries(data).map(([key, value]) => {
        let colItems = [];
        if (Array.isArray(value)) {
          colItems = value.map((v) => {
            const p = document.createElement('p');
            p.innerHTML = v;
            return p;
          });
        } else {
          colItems = [value];
        }
        return [key, colItems];
      });
    }
    return DOMUtils.createTable([headerRow, ...blockRows], document);
  }

  static getMetadataBlock(document, metadata) {
    return Blocks.createBlock(document, {
      name: 'Metadata',
      cells: metadata,
    });
  }

  static getMetadata(document) {
    const meta = {};

    const title = document.querySelector('title');
    if (title) {
      meta.Title = title.textContent.replace(/[\n\t]/gm, '');
    }

    const desc = getDocumentMetadata('description', document);
    if (desc) {
      meta.Description = desc;
    }

    const img = getDocumentMetadata('og:image', document);
    if (img) {
      const el = document.createElement('img');
      el.src = img;
      meta.Image = el;

      const imgAlt = getDocumentMetadata('og:image:alt', document);
      if (imgAlt) {
        el.alt = imgAlt;
      }
    }

    const ogtitle = getDocumentMetadata('og:title', document);
    if (ogtitle && ogtitle !== meta.Title) {
      if (meta.Title) {
        meta['og:title'] = ogtitle;
      } else {
        meta.Title = ogtitle;
      }
    }

    const ogdesc = getDocumentMetadata('og:description', document);
    if (ogdesc && ogdesc !== meta.Description) {
      if (meta.Description) {
        meta['og:description'] = ogdesc;
      } else {
        meta.Description = ogdesc;
      }
    }

    const ttitle = getDocumentMetadata('twitter:title', document);
    if (ttitle && ttitle !== meta.Title) {
      if (meta.Title) {
        meta['twitter:title'] = ttitle;
      } else {
        meta.Title = ttitle;
      }
    }

    const tdesc = getDocumentMetadata('twitter:description', document);
    if (tdesc && tdesc !== meta.Description) {
      if (meta.Description) {
        meta['twitter:description'] = tdesc;
      } else {
        meta.Description = tdesc;
      }
    }

    const timg = getDocumentMetadata('twitter:image', document);
    if (timg && timg !== img) {
      const el = document.createElement('img');
      el.src = timg;
      meta['twitter:image'] = el;

      const imgAlt = getDocumentMetadata('twitter:image:alt', document);
      if (imgAlt) {
        el.alt = imgAlt;
      }
    }

    return meta;
  }

  static computeBlockName(str) {
    return str
      .replace(/-/g, ' ')
      .replace(/\s(.)/g, (s) => s.toUpperCase())
      .replace(/^(.)/g, (s) => s.toUpperCase());
  }

  static convertBlocksToTables(element, document) {
    element.querySelectorAll('main > div:nth-child(4) > div[class]').forEach((block) => {
      const name = Blocks.computeBlockName(block.className);
      const data = [[name]];
      const divs = block.querySelectorAll(':scope > div');
      if (divs) {
        divs.forEach((div) => {
          const subDivs = div.querySelectorAll(':scope > div');
          if (subDivs && subDivs.length > 0) {
            const rowData = [];
            subDivs.forEach((cell) => {
              if (cell.nodeName === 'DIV') {
                // remove transparent divs
                const cellContent = [];
                Array.from(cell.childNodes).forEach((c) => cellContent.push(c));
                rowData.push(cellContent);
              }
            });
            data.push(rowData);
          } else {
            data.push([div.innerHTML]);
          }
        });
      }
      const table = DOMUtils.createTable(data, document);
      block.replaceWith(table);
    });
  }
}
