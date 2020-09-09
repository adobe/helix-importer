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
const { OneDrive } = require('@adobe/helix-onedrive-support');

const HelixImporterStorageHandler = require('../generic/HelixImporterStorageHandler');

class OneDriveHandler extends HelixImporterStorageHandler {
  constructor(opts = {}) {
    super(opts);
    this.logger = opts.logger || console;
    this.sharedLink = opts.sharedLink;
    this.drive = new OneDrive({
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      refreshToken: opts.refreshToken,
    });
  }

  async put(filePath, content) {
    this.logger.debug(`Uploading file to OneDrive: ${filePath}`);
    const rootItem = await this.drive.getDriveItemFromShareLink(this.sharedLink);
    const path = filePath.indexOf('/') === 0 ? filePath : `/${filePath}`;
    await this.drive.uploadDriveItem(content, rootItem, path);
  }

  async get(filePath) {
    this.logger.debug(`Reading file from OneDrive: ${filePath}`);
    const path = filePath.indexOf('/') === 0 ? filePath : `/${filePath}`;
    const rootItem = await this.drive.getDriveItemFromShareLink(this.sharedLink);
    const driveItem = await this.drive.getDriveItem(rootItem, path);
    return this.drive.downloadDriveItem(driveItem);
  }

  async exists(filePath) {
    try {
      const path = filePath.indexOf('/') === 0 ? filePath : `/${filePath}`;
      const rootItem = await this.drive.getDriveItemFromShareLink(this.sharedLink);
      await this.drive.getDriveItem(rootItem, path);
      return true;
    } catch (e) {
      // ignore
    }
    return false;
  }
}

module.exports = OneDriveHandler;
