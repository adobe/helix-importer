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

import os from 'os';

export default class CSV {
  /**
   * Minimalisatic CVS conversion of an array of objects:
   * first object keys determine the CVS headers.
   * Note: delimiter character is not supported in values
   * @param {object[]} entries List of object
   * @param {string} delimiter CSV delimiter
   * @param {boolean} skipHeaders True to skip the headers
   * @returns {string} CSV string
   */
  static toCSV(entries, delimiter = ';', skipHeaders = false) {
    let ret = '';
    if (entries && entries.length > 0) {
      // headers
      const headers = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const name in entries[0]) {
        // eslint-disable-next-line no-prototype-builtins
        if (entries[0].hasOwnProperty(name)) {
          headers.push(name);
          if (!skipHeaders) {
            ret += name + delimiter;
          }
        }
      }

      if (!skipHeaders) {
        ret += os.EOL;
      }

      entries.forEach((e) => {
        headers.forEach((h) => {
          ret += (e[h] || '') + delimiter;
        });
        ret += os.EOL;
      });
    }
    return ret;
  }

  /**
   * Converts a CSV string into an array of object
   * @param {string} csv The CSV string
   * @param {string} delimiter Delimiter string
   * @returns {object[]} An array of object for which each CSV column is a property
   */
  static toArray(csv, delimiter = ';') {
    const rows = csv.split(os.EOL);

    if (rows[rows.length - 1] === '') {
      // remove last element
      rows.pop();
    }

    let headers = [];
    const array = [];

    rows.forEach((r, i) => {
      if (i === 0) {
        // headers
        headers = r.split(delimiter);

        if (headers[headers.length - 1] === '') {
          // remove last element
          headers.pop();
        }
      } else {
        let values = r.split(delimiter);

        // remove last element(s)
        values = values.slice(0, headers.length);

        const obj = {};
        values.forEach((v, index) => {
          obj[headers[index].trim()] = v ? v.trim() : '';
        });
        array.push(obj);
      }
    });
    return array;
  }
}
