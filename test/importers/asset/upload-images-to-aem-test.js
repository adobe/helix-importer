/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import mockFs from 'mock-fs';
import sinon from 'sinon';
import {
  describe, it, beforeEach, afterEach,
} from 'mocha';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs-extra';
import uploadImagesToAEM from '../../../src/importer/asset/upload-images-to-aem.js';

// eslint-disable-next-line func-names
describe('uploadImagesToAEM', function () {
  this.timeout(20000); // Increase timeout to 10 seconds

  const markdownFilePath = 'test.md';
  const targetFolderName = 'mySite';
  const log = {
    error: sinon.spy(),
    info: sinon.spy(),
  };
  const opts = {
    targetFolderName,
    targetAEMUrl: 'https://author-p86802-e198698-cmstg.adobeaemcloud.com/',
    user: 'admin',
    password: '',
    log,
  };

  beforeEach(() => {
    mockFs({
      'test.md': '![Bingo](https://hlx.blob.core.windows.net/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60 "title1")\n![AdobeHome](https://odin.adobe.com/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg "AdobeHome")',
      uploads: {},
    });
  });

  afterEach(() => {
    mockFs.restore();
    log.error.resetHistory();
    log.info.resetHistory();
    sinon.restore();
  });

  // NOTE: this is an integration test (for sanity), so it will actually upload images to AEM
  it('should upload images to AEM', async () => {
    const result = await uploadImagesToAEM(opts, markdownFilePath);

    const filePath1 = path.join(process.cwd(), targetFolderName, '/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60.jpg');
    const filePath2 = path.join(process.cwd(), targetFolderName, '/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg');

    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath1)).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath2)).to.be.true;

    console.log(result);
  });
});
