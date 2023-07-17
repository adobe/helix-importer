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

describe('MDUtils#replaceSrcInMarkdown tests', () => {
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

  it('MDUtils#replaceSrcInMarkdown can be called multiple times', () => {
    const md = '![](/book/resources/_prod/img/hero/image.jpg)\n\n# Title for the page\n\n![](/book/resources/_prod/img/hero/image.jpg)';
    const expected = '![](https://www.sample.com/book/resources/_prod/img/hero/image.jpg)\n\n# Title for the page\n\n![](https://www.sample.com/book/resources/_prod/img/hero/image.jpg)';
    const round1 = MDUtils.replaceSrcInMarkdown(md, '/book/resources/_prod/img/hero/image.jpg', 'https://www.sample.com/book/resources/_prod/img/hero/image.jpg');
    const round2 = MDUtils.replaceSrcInMarkdown(round1, '/book/resources/_prod/img/hero/image.jpg', 'https://www.sample.com/book/resources/_prod/img/hero/image.jpg');
    strictEqual(
      expected,
      round1,
      'relative to absolute replacement (multiple replacements - round1)',
    );
    strictEqual(
      expected,
      round2,
      'relative to absolute replacement (multiple replacements - round2)',
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

describe('MDUtils#cleanupMarkdown tests', () => {
  it('MDUtils#cleanupMarkdown do nothing', () => {
    const md = '#A title\n![](https://www.sample.com/image.jpg)\nShould be clean\n<table><tr><th colspan="2">Metadata</th></tr><tr><td>key</td><td>value</td></tr></table>';
    strictEqual(
      MDUtils.cleanupMarkdown(md),
      md,
      'do nothing',
    );
  });

  it('MDUtils#cleanupMarkdown replace weird spaces', () => {
    strictEqual(
      MDUtils.cleanupMarkdown('#A title\nReplaces the weird spaces characters: "\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019"'),
      '#A title\nReplaces the weird spaces characters: "                    "',
      'replace weird spaces',
    );
  });

  it('MDUtils#cleanupMarkdown replace invisible characters', () => {
    strictEqual(
      MDUtils.cleanupMarkdown('Vols à partir de Paris'),
      'Vols à partir de Paris',
      'replace invisble characters',
    );
  });
});
