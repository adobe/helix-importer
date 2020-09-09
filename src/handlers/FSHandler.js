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
const fs = require('fs-extra');
const path = require('path');

const HelixImporterStorageHandler = require('../generic/HelixImporterStorageHandler');

class OneDriveHandler extends HelixImporterStorageHandler {
  constructor(opts = {}) {
    super(opts);
    this.logger = opts.logger || console;
    this.target = opts.target;
  }

  async put(filePath, content) {
    const local = path.resolve(this.target, filePath);
    this.logger.debug(`Writting file to file system: ${local}`);
    await fs.mkdirs(path.dirname(local));
    await fs.writeFile(local, content);
  }

  async get(filePath) {
    const local = path.resolve(this.target, filePath);
    this.logger.debug(`Reading file from file system: ${local}`);

    return fs.readFile(local);
  }

  async exists(filePath) {
    const local = path.resolve(this.target, filePath);
    this.logger.debug(`Checking if file from file system exists: ${local}`);

    return fs.exists(local);
  }
}

module.exports = OneDriveHandler;
