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

import path from 'path';
// import fs from 'fs-extra';
import { FileSystemUploadOptions, FileSystemUpload } from '@adobe/aem-upload';
import downloadImagesInMarkdown from './download-images-from-md.js';

/**
 * Create a temporary folder to store the images.
 */
// async function createTempDirForImages(tempFolder) {
//   await fs.ensureDir(tempFolder);
// }

/**
 * Clean up temporary folder containing the images.
 */
// async function deleteTempDirForImages(tempFolder) {
//   await fs.remove(tempFolder);
// }

/**
 * Build the AEM Assets URL to which the assets need to be uploaded.
 *
 * @param targetUrl - The URL of the AEM Assets instance
 * @returns {string} The URL to which the assets need to be uploaded
 */
function buildAEMUrl(targetUrl) {
  let AEMUrl = targetUrl;
  // Ensure the URL starts with http:// or https://
  if (!/^https?:\/\//i.test(AEMUrl)) {
    AEMUrl = `https://${AEMUrl}`;
  }

  // Strip any trailing `/` from the aem url
  AEMUrl = AEMUrl.replace(/\/+$/, '');

  // Append `/content/dam`
  return new URL('/content/dam', AEMUrl).toString();
}

/**
 * Get the encoded credentials for basic authentication.
 *
 * @param user - The AEM username
 * @param password - The AEM password
 * @returns {string} The encoded credentials
 */
function getEncodedCredentials(user, password) {
  return Buffer.from(`${user}:${password}`).toString('base64');
}

/**
 * Build the FileSystemUploadOptions for uploading images to AEM.
 *
 * @param opts - The options for uploading images to AEM
 * @returns {DirectBinaryUploadOptions}
 */
function buildFileSystemUploadOptions(opts) {
  const { targetAEMUrl, user, password } = opts;

  return new FileSystemUploadOptions()
    .withUrl(buildAEMUrl(targetAEMUrl))
    .withConcurrent(true)
    .withMaxConcurrent(10)
    .withDeepUpload(true) // include all descendent folders and files
    .withHttpOptions({
      headers: {
        Authorization: `Basic ${getEncodedCredentials(user, password)}`,
      },
    })
    // If true and an asset with the given name already exists, the process will delete the existing
    // asset and create a new one with the same name and the new binary.
    .withUploadFileOptions({ replace: true });
}

/**
 * Create a file uploader to upload images. Attach event listeners to handle file upload events.
 *
 * @param log - The logger to use for logging events
 * @returns {FileSystemUpload} The file uploader
 */
function createFileUploader(log) {
  const fileUpload = new FileSystemUpload();

  // specific handling that should occur when a file finishes uploading successfully
  fileUpload.on('fileend', (data) => {
    const { fileName } = data;
    log.info(`Uploaded asset: ${fileName}`);
  });

  // specific handling that should occur when a file upload fails
  fileUpload.on('fileerror', (data) => {
    const { fileName, errors } = data;
    log.error(`Failed to upload asset: ${fileName}. ${errors.toString()}`);
  });

  return fileUpload;
}

/**
 * Upload images from urls in markdown file to AEM.
 *
 * @param opts - The options for uploading images to AEM
 * @param markdownFilePath - The path to the markdown file containing the image urls
 * @returns {Promise<UploadResult>} The result of the upload operation
 */
export default async function uploadImagesToAEM(opts, markdownFilePath) {
  const { targetFolderName, log } = opts;

  // create a temporary folder to store the images
  const downloadLocation = path.join(process.cwd(), targetFolderName);
  // await createTempDirForImages(downloadLocation);

  // download images from the markdown file
  await downloadImagesInMarkdown({ log, retries: 3, downloadLocation }, markdownFilePath);

  // upload all assets in given folder
  const fileUpload = createFileUploader(log);
  const result = await fileUpload.upload(buildFileSystemUploadOptions(opts), [downloadLocation]);

  // clean up the temporary folder
  // await deleteTempDirForImages(downloadLocation);

  return result;
}
