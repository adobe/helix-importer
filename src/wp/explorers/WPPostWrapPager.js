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

import fetch from 'node-fetch';
import PagingExplorer from '../../explorer/PagingExplorer.js';

const API = 'page/';

export default class WPPostWrapPager extends PagingExplorer {
  async fetch(page) {
    const api = `${this.params.url}${API}${page}`;
    return fetch(api);
  }

  // eslint-disable-next-line class-methods-use-this
  process(document, all) {
    const entries = [];
    document.querySelectorAll('.post-meta-wrap').forEach((el) => {
      const link = el.querySelector('.post-item > a');
      const url = link.getAttribute('href');

      const entryDate = el.querySelector('.post-date');
      const date = entryDate.textContent.trim();

      if (all.findIndex((entry) => entry.url === url) === -1) {
        entries.push({
          date,
          url,
        });
      }
    });
    return entries;
  }
}
