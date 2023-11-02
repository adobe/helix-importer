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
import PageImporter from './importer/PageImporter.js';
import PageImporterParams from './importer/PageImporterParams.js';
import PageImporterResource from './importer/PageImporterResource.js';

import FSHandler from './storage/FSHandler.js';
import MemoryHandler from './storage/MemoryHandler.js';

import Blocks from './utils/Blocks.js';
import CSV from './utils/CSV.js';
import DOMUtils from './utils/DOMUtils.js';
import FileUtils from './utils/FileUtils.js';
import Loader from './utils/Loader.js';
import Utils from './utils/Utils.js';

import WPUtils from './wp/WPUtils.js';

import { html2md, html2docx } from './importer/HTML2x.js';

import createMetadata from './importer/defaults/rules/createMetadata.js';
import adjustImageUrls from './importer/defaults/rules/adjustImageUrls.js';
import convertIcons from './importer/defaults/rules/convertIcons.js';
import transformBackgroundImages from './importer/defaults/rules/transformBackgroundImages.js';

const rules = {
  createMetadata,
  adjustImageUrls,
  convertIcons,
  transformBackgroundImages,
};

export {
  PageImporter,
  PageImporterParams,
  PageImporterResource,
  FSHandler,
  MemoryHandler,
  Blocks,
  CSV,
  DOMUtils,
  FileUtils,
  Loader,
  Utils,
  WPUtils,
  html2md,
  html2docx,
  rules,
};
