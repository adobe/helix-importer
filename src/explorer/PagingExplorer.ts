/*
 * Copyright 2020 Adobe. All rights reserved.
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

import Explorer from './Explorer';

import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';
import PagingExplorerParams from './PagingExplorerParams';

export default abstract class PagingExplorer implements Explorer {
  params: PagingExplorerParams;

  constructor(params: PagingExplorerParams) {
      this.params = params;
  }

  async explore(page = 1, pageCallback?: (entries: any[], index: number, results: any[]) => Promise<void>): Promise<object[]> {
    const startTime = new Date().getTime();

    let results = [];

    while(page <= this.params.nbMaxPages) {
      console.log(`${this.params.url}: Requesting page ${page}/${this.params.nbMaxPages}.`);

      const res = await this.fetch(page);

      if (!res.ok) {
        console.log(`${this.params.url}: Invalid response, considering no more results`);
        break;
      } else {
        const text = await res.text();

        if (text) {
          const { document } = (new JSDOM(text)).window;

          const entries = this.process(document, results);

          if (entries && entries.length > 0) {
            results = results.concat(entries);
            if (pageCallback) {
              await pageCallback(entries, page, results);
            }
          } else {
            console.log(`${this.params.url}: No entries found on page ${page}`);
            break;
          }

        } else {
          console.log(`${this.params.url}: No more results`);
          break;
        }

        page += 1;
      }
    }

    console.log();
    console.log(`${this.params.url}: Process stopped at page ${page - 1} on ${this.params.nbMaxPages}.`);
    console.log(`${this.params.url}: Imported ${results.length} post entries.`);
    console.log(`${this.params.url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  abstract fetch(page: number): Promise<Response>;
  abstract process(document: Document, entries: object[]): object[];
}