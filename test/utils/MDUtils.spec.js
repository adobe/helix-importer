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

import { strictEqual } from 'assert';
import { describe, it } from 'mocha';

import MDUtils from '../../src/utils/MDUtils.js';

describe('MDUtils tests', () => {
  it('MDUtils#replaceSrcInMarkdown do nothing', () => {
    strictEqual(
      MDUtils.replaceSrcInMarkdown('#A title\n![](https://www.sample.com/image.jpg)', 'https://www.sample.com/replace.jpg', 'https://www.sample.com/withimage.jpg'),
      '#A title\n![](https://www.sample.com/image.jpg)',
      'do nothing',
    );
  });

  it('MDUtils#replaceSrcInMarkdown can replace', () => {
    strictEqual(
      MDUtils.replaceSrcInMarkdown('#A title\n![](https://www.sample.com/image.jpg)', 'https://www.sample.com/image.jpg', 'https://www.sample.com/withimage.jpg'),
      '#A title\n![](https://www.sample.com/withimage.jpg)',
      'basic replacement',
    );

    strictEqual(
      MDUtils.replaceSrcInMarkdown('#A title\n![](/image.jpg)', '/image.jpg', 'https://www.sample.com/image.jpg'),
      '#A title\n![](https://www.sample.com/image.jpg)',
      'relative to absolute replacement',
    );

    strictEqual(
      MDUtils.replaceSrcInMarkdown('![](/book/resources/_prod/img/hero/image.jpg)\n\n# Title for the page', '/book/resources/_prod/img/hero/image.jpg', 'https://www.sample.com/book/resources/_prod/img/hero/image.jpg'),
      '![](https://www.sample.com/book/resources/_prod/img/hero/image.jpg)\n\n# Title for the page',
      'relative to absolute replacement (no double replacement)',
    );
  });

  it('MDUtils#replaceSrcInMarkdown can replace with encoding', () => {
    strictEqual(
      MDUtils.replaceSrcInMarkdown('#A title\n![](https://www.sample.com/imagé.jpg)', 'https://www.sample.com/imag%C3%A9.jpg', 'https://www.sample.com/withsomethingelse.jpg'),
      '#A title\n![](https://www.sample.com/withsomethingelse.jpg)',
      'encoded to replacement',
    );
  });
});
