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

import fs from 'fs-extra';
import path from 'path';

export default class FSHandler {
  target;

  logger;

  constructor(target, logger) {
    this.logger = logger || console;
    this.target = target;
  }

  async put(filePath, content) {
    const local = path.resolve(path.join(this.target, filePath));
    this.logger.log(`Writting file to file system: ${local}`);
    await fs.mkdirs(path.dirname(local));
    await fs.writeFile(local, content);
  }

  async get(filePath) {
    const local = path.resolve(this.target, filePath);
    this.logger.log(`Reading file from file system: ${local}`);

    return fs.readFile(local);
  }

  async exists(filePath) {
    const local = path.resolve(this.target, filePath);
    this.logger.log(`Checking if file from file system exists: ${local}`);

    return fs.exists(local);
  }
}
