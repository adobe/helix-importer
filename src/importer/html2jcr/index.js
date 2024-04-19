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
import rehypeParse from 'rehype-parse';
import { raw } from 'hast-util-raw';
import { unified } from 'unified';
import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import remarkGridTable from '@adobe/remark-gridtables';
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import rehypeFormat from 'rehype-format';
import createPageBlocks from '@adobe/helix-html-pipeline/src/steps/create-page-blocks.js';
import { h } from 'hastscript';
import fixSections from '@adobe/helix-html-pipeline/src/steps/fix-sections.js';
import hast2jcr from './hast2jcr/index.js';

async function html2jcr(html, opts) {
  const hast = unified()
    .use(rehypeParse)
    .parse(html);

  return hast2jcr(hast, opts);
}

async function md2jcr(md, opts) {
  const mdast = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGridTable)
    .parse(md);

  const main = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  const content = { hast: main };

  fixSections({ content });
  createPageBlocks({ content });

  const doc = h('html', [
    h('body', [
      h('header', []),
      h('main', content.hast),
      h('footer', [])]),
  ]);

  raw(doc);
  rehypeFormat()(doc);
  return hast2jcr(doc, opts);
}

export {
  html2jcr,
  md2jcr,
};
