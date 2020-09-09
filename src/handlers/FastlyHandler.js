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

const fastly = require('@adobe/fastly-native-promises');
const { URL } = require('url');

class FastlyHandler {
  constructor({ logger, fastlyServiceId, fastlyToken } = {}) {
    this.logger = logger || console;
    this.service = fastly(fastlyToken, fastlyServiceId);
  }

  async addDictEntry(sourceurl, year) {
    const path = new URL(sourceurl).pathname.replace(/\/$/, '');

    return this.service.bulkUpdateDictItems(undefined, 'redirects', { item_key: path, item_value: year, op: 'upsert' });
  }
}

module.exports = FastlyHandler;
