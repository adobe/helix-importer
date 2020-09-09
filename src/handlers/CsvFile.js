/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const fs = require('fs');
const csv = require('fast-csv');

class CsvFile {
  static async write(filestream, rows, options) {
    return new Promise((res, rej) => {
      csv.writeToStream(filestream, rows, options)
        .on('error', (err) => {
          console.error('Error writing file', err);
          rej(err);
        })
        .on('finish', () => res());
    });
  }

  constructor(opts) {
    this.headers = opts.headers;
    this.path = opts.path;
    this.writeOpts = { headers: this.headers, includeEndRowDelimiter: true };
  }

  async create(rows) {
    return CsvFile.write(fs.createWriteStream(this.path), rows, { ...this.writeOpts });
  }

  async append(rows) {
    return CsvFile.write(fs.createWriteStream(this.path, { flags: 'a' }), rows, {
      ...this.writeOpts,
      // dont write the headers when appending
      writeHeaders: false,
    });
  }

  async read() {
    return fs.readFile(this.path);
  }

  async readRows(cb) {
    return new Promise((resolve, reject) => {
      csv.parseStream(fs.createReadStream(this.path), { headers: true })
        .on('data', async (row) => {
          cb(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

module.exports = CsvFile;
