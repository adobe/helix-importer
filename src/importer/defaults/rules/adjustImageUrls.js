/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const adjustImageUrls = (main, url) => {
  [...main.querySelectorAll('img')].forEach((img) => {
    const src = img.getAttribute('src');
    if (src && (src.startsWith('./') || src.startsWith('/') || src.startsWith('../'))) {
      try {
        const u = new URL(src, url);
        // eslint-disable-next-line no-param-reassign
        img.src = u.toString();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Unable to adjust image URL ${img.src} - removing image`);
        img.remove();
      }
    }
  });
};

export default adjustImageUrls;
