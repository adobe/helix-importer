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
import { expect } from 'chai';
import mockFs from 'mock-fs';
import fs from 'fs-extra';
import sinon from 'sinon';
import {
  describe, it, beforeEach, afterEach, after,
} from 'mocha';
import path from 'path';
import downloadImagesInMarkdown from '../../../src/importer/asset/download-images-from-md.js';

// eslint-disable-next-line func-names
describe('downloadImagesInMarkdown', function () {
  // Increase timeout to 100 seconds (to account for exponential backoff during retries)
  this.timeout(100000);

  const markdownFilePath = 'test.md';
  const downloadLocation = path.join(process.cwd(), 'mySite');
  const log = {
    error: sinon.spy(),
    info: sinon.spy(),
  };
  const ctx = { log, downloadLocation, retries: 3 };

  beforeEach(() => {
    mockFs({
      'test.md': '![AdobeHome](https://odin.adobe.com/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg "AdobeHome")',
      downloads: {},
    });
  });

  afterEach(() => {
    mockFs.restore();
    log.error.resetHistory();
    log.info.resetHistory();
  });

  after(async () => {
    // Cleanup logic here
    await fs.remove(downloadLocation);
  });

  it('should download images from markdown file', async () => {
    await downloadImagesInMarkdown(ctx, markdownFilePath);

    const filePath = path.join(downloadLocation, '/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg');

    // const files = await fs.readdir(downloadLocation);
    // expect(files).to.include('B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg');
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath)).to.be.true;
  });

  it('should log an error if image download fails', async () => {
    // should not resolve the image URL (doesn't exist)
    mockFs({
      'test.md': '![Bingo](https://hlx.blob.core.windows.net/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa6)',
      downloads: {},
    });

    await downloadImagesInMarkdown(ctx, markdownFilePath);

    // eslint-disable-next-line no-unused-expressions
    expect(log.error.called).to.be.true;
  });

  it('should handle markdown file with no images', async () => {
    mockFs({
      'test.md': 'This is a markdown file with no images.',
      downloads: {},
    });

    await downloadImagesInMarkdown(ctx, markdownFilePath);

    const files = await fs.readdir(downloadLocation);
    // eslint-disable-next-line no-unused-expressions
    expect(files).to.be.empty;
  });

  it('should log an error for invalid image URL', async () => {
    mockFs({
      'test.md': '![alt text](invalid-url "title")',
      downloads: {},
    });

    await downloadImagesInMarkdown(ctx, markdownFilePath);

    // eslint-disable-next-line no-unused-expressions
    expect(log.error.called).to.be.true;
  });

  it('should handle images blob (without extension)', async () => {
    mockFs({
      'test.md': '![Bingo](https://hlx.blob.core.windows.net/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60)',
      downloads: {},
    });

    await downloadImagesInMarkdown(ctx, markdownFilePath);

    const filePath = path.join(downloadLocation, '/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60.jpg');

    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath)).to.be.true;
  });

  it('should handle multiple images in markdown file', async () => {
    mockFs({
      'test.md': '![Bingo](https://hlx.blob.core.windows.net/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60 "title1")\n![AdobeHome](https://odin.adobe.com/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg "AdobeHome")',
      downloads: {},
    });

    await downloadImagesInMarkdown(ctx, markdownFilePath);

    const filePath1 = path.join(downloadLocation, '/external/1e25afe94fdf580b8c84ebd37abcf1e63044aa60.jpg');
    const filePath2 = path.join(downloadLocation, '/adobe/dynamicmedia/deliver/dm-aid--3d92807a-df0f-461a-a207-9a66223a22e9/B_IlluAdobeHome_MemberPerks_Stock_Dark_1x.jpg');

    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath1)).to.be.true;
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(filePath2)).to.be.true;
  });
});
