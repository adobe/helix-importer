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

import sanitize from 'sanitize-filename';

export default class FileUtils {
  static sanitizeFilename(name) {
    if (!name) return '';
    return sanitize(decodeURIComponent(name))
      .trim()
      .toLowerCase()
      .replace(/\./gm, '')
      .replace(/&/gm, '')
      .replace(/\s/g, '-')
      .replace(/-{2,}/g, '-');
  }

  static sanitizePath(path) {
    if (!path) return '';
    const extension = path.split('.').pop();
    const pathname = extension !== path ? path.substring(0, path.lastIndexOf('.')) : path;
    let sanitizedPath = '';
    pathname.split('/').forEach((p) => {
      if (p !== '') {
        sanitizedPath += `/${FileUtils.sanitizeFilename(p)}`;
      }
    });
    if (extension !== path) {
      sanitizedPath += `.${extension}`;
    }
    return sanitizedPath;
  }
}
