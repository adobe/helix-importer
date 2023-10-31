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

export default class BrowserUtils {
  /**
   * Creates a document from a html string. This function use DOMParser
   * which should be available in execution context, i.e. a browser.
   * @param {String} html The html to parse
   * @returns Document The parsed document
   */
  static createDocumentFromString(html) {
    try {
      // eslint-disable-next-line no-undef
      const parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    } catch (e) {
      throw new Error('Unable to parse HTML using default createDocumentFromString function and global DOMParser. Please provide a custom createDocumentFromString.');
    }
  }
}
