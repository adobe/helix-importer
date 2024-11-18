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

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

/**
 * Function to scan for images in a markdown file.
 *
 * @param filePath
 * @returns {*[]} an array of image objects
 */
function findImagesInMarkdown(filePath) {
  // Regular expression to match Markdown image syntax
  const imageRegex = /!\[([^\]]*)]\(([^) "]+)(?: *"([^"]*)")?\)/g;

  // Read the Markdown file
  const content = fs.readFileSync(filePath, 'utf8');

  // Find and log each image
  const images = [];
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = imageRegex.exec(content)) !== null) {
    // Process match
    images.push({
      altText: match[1],
      url: match[2],
      title: match[3] || null,
    });
  }
  return images;
}

/**
 * Function to get the file extension based on the content type.
 *
 * @param contentType - The content type of the image
 * @returns {string} The file extension
 */
function getExtension(contentType) {
  let extension = '';
  if (contentType) {
    switch (contentType) {
      case 'image/jpg':
        extension = '.jpg';
        break;
      case 'image/jpeg':
        extension = '.jpg';
        break;
      case 'image/png':
        extension = '.png';
        break;
      case 'image/gif':
        extension = '.gif';
        break;
      // If the content type is not recognized, should we try to do some kind of conversion?
      default:
        extension = '';
    }
  }
  return extension;
}

/**
 * Function to get the image name from the URL.
 *
 * @param url - The URL of the image
 * @param contentType - The content type of the image
 * @returns {*|string} The name of the image
 */
function getImageName(url, contentType) {
  const extension = getExtension(contentType);
  const imageName = url.split('/').pop();
  // If the image name already has an extension, return it as is; else append the extension
  return imageName.includes('.') ? imageName : `${imageName}${extension}`;
}

/**
 * Function to get the path segments from the URL.
 * @param url - The URL of the image
 * @returns {string} The path segments as a string
 */
function getPathSegments(url) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter((segment) => segment);
  return `/${pathSegments.slice(0, -1).join('/')}`;
}

/**
 * Function to download an image with retry.
 *
 * @param url - The URL of the image to download
 * @param opts - Additional options for downloading the image
 */
// eslint-disable-next-line consistent-return
async function downloadImage(url, opts) {
  const { log, retries, downloadLocation } = opts;
  // eslint-disable-next-line no-plusplus
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url);

      if (!response.ok) {
        const msg = `Failed to fetch ${url}. Status: ${response.status}.`;
        log.error(msg);
        throw new Error(msg);
      }

      // Create the image path
      let imagePath = path.join(downloadLocation, getPathSegments(url));
      // eslint-disable-next-line no-await-in-loop
      await fs.ensureDir(imagePath);
      imagePath = path.join(imagePath, getImageName(url, response.headers.get('content-type')));

      const writer = fs.createWriteStream(imagePath);
      return new Promise((resolve, reject) => {
        response.body.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      if (attempt === retries) {
        throw error;
      } else {
        log.info(`Retrying download (${attempt}/${retries})...`);
      }
    }
  }
}

/**
 * Function to download all images to given location.
 *
 * @param imageUrls - The URLs of the images to download
 * @param opts - Options for downloading the images
 * @returns {Promise<void>}
 */
async function downloadImages(imageUrls, opts) {
  const { log } = opts;
  // Map over the imageUrls array and create a promise for each image download.
  // eslint-disable-next-line consistent-return
  const downloadPromises = imageUrls.map(async (url) => {
    try {
      await downloadImage(url, opts);
    } catch (error) {
      log.error(`Failed to download ${url} after ${opts.retries} attempts.`);
      return null;
    }
  });

  // Wait for all downloads to complete
  // The promises are passed to Promise.all, which runs them in parallel
  await Promise.all(downloadPromises);
}

/**
 * Function to download images present in given markdown file.
 *
 * @param opts - The options for downloading images
 * @param markdownFilePath - The path to the markdown file
 * @returns {Promise<void>}
 */
export default async function downloadImagesInMarkdown(opts, markdownFilePath) {
  const { downloadLocation } = opts;

  // gather all image nodes
  const images = findImagesInMarkdown(markdownFilePath);

  // ensure that the folder to store the images exists
  await fs.ensureDir(downloadLocation);

  // download images to the given location
  await downloadImages(images.map((image) => image.url), opts);
}
