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

/* tslint:disable: no-console */

import PagingExplorer from '../../explorer/PagingExplorer';

import FormData from 'form-data';
import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import { Document } from 'jsdom';

const API = 'wp-admin/admin-ajax.php';

export class WPAdminAjaxPager extends PagingExplorer {
  async fetch(page: number): Promise<Response> {
    const api = `${this.params.url}${API}`;
    const form = new FormData();
    form.append('action', 'cardsFilter');
    form.append('filterBy', 'latest');
    form.append('paged', `${page}`);
    return fetch(api, {
      method: 'POST',
      body: form,
    });
  }

  process(document: Document, all: any[]): object[] {
    const entries = [];
    document.querySelectorAll('.card-item').forEach((el) => {
      const link = el.querySelector('h4 a');
      const url = link.getAttribute('href');

      const entryDate = el.querySelector('.date');
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
