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

const DEFAULT_COLSPAN = 2;

export default class Blocks {
  static getMetadataBlock(document, metadata) {
    const table = document.createElement('table');

    let row = document.createElement('tr');
    table.append(row);

    const hCell = document.createElement('th');
    row.append(hCell);

    hCell.innerHTML = 'Metadata';
    hCell.setAttribute('colspan', DEFAULT_COLSPAN);

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in metadata) {
      row = document.createElement('tr');
      table.append(row);
      const keyCell = document.createElement('td');
      row.append(keyCell);
      keyCell.textContent = key;
      const valueCell = document.createElement('td');
      row.append(valueCell);
      const value = metadata[key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            const p = document.createElement('p');
            p.innerHTML = v;
            valueCell.append(p);
          });
        } else if (typeof value === 'string') {
          valueCell.textContent = value;
        } else {
          valueCell.append(value);
        }
      }
    }

    return table;
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
