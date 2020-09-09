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

class ExcelHandler {
  constructor(opts = {}) {
    this.logger = opts.logger || console;
    this.sharedLink = opts.sharedLink;
    this.drive = new OneDrive({
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      refreshToken: opts.refreshToken,
      log: this.logger,
    });
  }

  async getRows(filePath, worksheet, table) {
    this.logger.debug(`Reading table ${table} from worksheet ${worksheet} in file: ${filePath}`);
    const rootItem = await this.drive.getDriveItemFromShareLink(this.sharedLink);
    const path = filePath.indexOf('/') === 0 ? filePath : `/${filePath}`;
    const item = await this.drive.getDriveItem(rootItem, path);
    const uri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/${worksheet}/tables/${table}/rows`;
    const rows = await (await this.drive.getClient(false)).get(uri);
    return rows;
  }

  async addRow(filePath, worksheet, table, values, maxRetry = 5) {
    this.logger.debug(`Adding row to file: ${filePath}`);
    try {
      const rootItem = await this.drive.getDriveItemFromShareLink(this.sharedLink);
      const path = filePath.indexOf('/') === 0 ? filePath : `/${filePath}`;
      const item = await this.drive.getDriveItem(rootItem, path);
      const uri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/${worksheet}/tables/${table}/rows/add`;
      const client = await this.drive.getClient();
      const response = await client({
        uri,
        method: 'POST',
        body: {
          index: null,
          values,
        },
        json: true,
      });
      this.logger.debug(response);
      return response;
    } catch (error) {
      if (maxRetry === 0) {
        throw new Error(`Failed to addRow to ${filePath}`);
      }
      // retry
      return this.addRow(filePath, worksheet, table, values, maxRetry - 1);
    }
  }
}

module.exports = ExcelHandler;
