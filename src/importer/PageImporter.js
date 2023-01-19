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

/* eslint-disable class-methods-use-this */

import { JSDOM } from 'jsdom';

import path from 'path';
import { unified } from 'unified';
import parse from 'rehype-parse';
import { toHtml } from 'hast-util-to-html';
import rehype2remark from 'rehype-remark';
import stringify from 'remark-stringify';
import fs from 'fs-extra';
import { md2docx } from '@adobe/helix-md2docx';
import remarkGridTable from '@adobe/remark-gridtables';
import { imageReferences } from '@adobe/helix-markdown-support';
import gridtableHandlers from './hast-to-mdast-gridtable-handlers.js';
import Utils from '../utils/Utils.js';
import DOMUtils from '../utils/DOMUtils.js';
import FileUtils from '../utils/FileUtils.js';
import MDUtils from '../utils/MDUtils.js';

function remarkImageReferences() {
  return imageReferences;
}

export default class PageImporter {
  params;

  logger;

  useCache;

  constructor(params) {
    this.params = params;
    this.logger = params.logger || console;

    this.useCache = !!params.cache;
  }

  async convertToDocx(docxPath, content) {
    const buffer = await md2docx(content, {
      log: this.logger,
      ...this.params.mdast2docxOptions,
    });
    return this.params.storageHandler.put(docxPath, buffer);
  }

  async createMarkdown(resource, url) {
    const { name } = resource;
    const { directory } = resource;
    const sanitizedName = FileUtils.sanitizeFilename(name);
    this.logger.log(`Computing Markdown for ${directory}/${sanitizedName}`);

    const processor = unified()
      .use(parse, { emitParseErrors: true })
      .use(rehype2remark, {
        handlers: {
          hlxembed: (state, node) => {
            const children = node.children.map((child) => processor.stringify(child).trim());
            return {
              type: 'paragraph',
              children: [{
                type: 'text',
                value: children.join(''),
              }],
            };
          },
          u: (state, node) => {
            if (node.children && node.children.length > 0) {
              const children = node.children.map((child) => {
                try {
                  if (child.type === 'element' && child.tagName !== 'span') {
                    const n = {
                      type: child.tagName,
                      children: child.children,
                    };
                    return processor.stringify(n).trim();
                  }
                  return processor.stringify(child).trim();
                } catch (e) {
                  // cannot stringify the node, return html
                  return toHtml(child);
                }
              });
              return {
                type: 'html',
                value: `<u>${children.join('')}</u>`,
              };
              // todo: use this
              // return [{
              //   type: 'html',
              //   value: '<u>',
              // },
              //   ...state.all(node),
              // {
              //   type: 'html',
              //   value: '</u>',
              // }];
            }
            return '';
          },
          ...gridtableHandlers,
        },
      })
      .use(remarkImageReferences)
      .use(remarkGridTable)
      .use(stringify, {
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        rule: '-',
        ruleRepetition: 3,
        ruleSpaces: false,
      });

    const file = await processor.process(resource.document.innerHTML);
    let contents = String(file);

    // process image links
    const { document } = resource;
    const assets = [];
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      const { src } = img;
      const isEmbed = img.classList.contains('hlx-embed');
      if (!isEmbed && src && src !== '' && (contents.indexOf(src) !== -1 || contents.indexOf(decodeURI(src)) !== -1)) {
        assets.push({
          url: src,
          append: '#image.png',
        });
      }
    });

    const as = document.querySelectorAll('a');
    as.forEach((a) => {
      const { href } = a;
      if ((href && href !== '' && contents.indexOf(href) !== -1) || contents.indexOf(decodeURI(href)) !== -1) {
        try {
          const u = new URL(href, url);
          const ext = path.extname(u.href);
          if (ext === '.mp4') {
            // upload mp4
            assets.push({
              url: href,
              append: '#image.mp4',
            });
          }
        } catch (error) {
          this.logger.warn(`Invalid link in the page: ${href}`, error);
        }
      }
    });

    const vs = document.querySelectorAll('video source');
    vs.forEach((s) => {
      const { src } = s;
      if ((src && src !== '' && contents.indexOf(src) !== -1) || contents.indexOf(decodeURI(src)) !== -1) {
        try {
          const u = new URL(src, url);
          const ext = path.extname(u.href);
          if (ext === '.mp4') {
            const poster = s.parentNode.getAttribute('poster');
            if (poster) {
              assets.push({
                url: poster,
              });
            }
            // upload mp4
            assets.push({
              url: src,
              append: '#image.mp4',
            });
          }
        } catch (error) {
          this.logger.warn(`Invalid video in the page: ${src}`, error);
        }
      }
    });

    // adjust assets url (from relative to absolute)
    assets.forEach((asset) => {
      const u = new URL(decodeURI(asset.url), url);
      contents = MDUtils.replaceSrcInMarkdown(contents, asset.url, u.toString());
    });

    if (resource.prepend) {
      contents = resource.prepend + contents;
    }

    contents = this.postProcessMD(contents);

    return {
      path: path.join(directory, sanitizedName),
      content: contents,
    };
  }

  cleanup(document) {
    DOMUtils.remove(document, ['script', 'hr']);
    DOMUtils.removeComments(document);
    DOMUtils.removeSpans(document);
  }

  preProcess(document) {
    this.cleanup(document);
    DOMUtils.reviewHeadings(document);
    DOMUtils.reviewParagraphs(document);
    DOMUtils.escapeSpecialCharacters(document);
    [
      'b',
      'a',
      'big',
      'code',
      'em',
      'i',
      'label',
      's',
      'small', /* , 'span' */
      'strong',
      'sub',
      'sup',
      'u',
      'var',
    ].forEach((tag) => DOMUtils.reviewInlineElement(document, tag));

    // u a tag combo is not handled properly by unified js and is discouraged anyway -> remove the u
    const us = [];
    document.querySelectorAll('u > a, u > span > a').forEach((a) => {
      const u = a.closest('u');
      u.before(a);
      us.push(u);
    });
    us.forEach((u) => u.remove());

    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      let src = img.getAttribute('src');
      const dataSrc = img.getAttribute('data-src');
      if (!src && dataSrc) {
        // lazy loading case
        img.setAttribute('src', dataSrc);
      }

      if (dataSrc && src && src.indexOf('data:') === 0) {
        // b64 img, try replace with dataSrc
        img.setAttribute('src', dataSrc);
      }

      src = img.getAttribute('src');
      if (!src || src.indexOf('data:') === 0) {
        // we cannot handle b64 asset for now, remove
        img.remove();
      }

      const alt = img.getAttribute('alt');
      const title = img.getAttribute('title');
      if (title && title === alt) {
        // a11y: image title has little value if it's the same than the alt text.
        img.removeAttribute('title');
      }
    });
  }

  postProcess(document) {
    DOMUtils.encodeImagesForTable(document);
  }

  postProcessMD(md) {
    return MDUtils.cleanupMarkdown(md);
  }

  async download(url) {
    const getLocalCacheName = (p) => path.resolve(p, `${new URL(url).pathname.replace(/^\/+|\/+$/g, '').replace(/\//gm, '_')}.html`);

    if (this.useCache) {
      const localPath = getLocalCacheName(this.params.cache);
      if (await fs.exists(localPath)) {
        return fs.readFile(localPath);
      }
    }

    const res = await this.fetch(url);
    if (!res.ok) {
      this.logger.error(`${url}: Invalid response`, res);
      throw new Error(`${url}: Invalid response - ${res.statusText}`);
    } else {
      const html = await res.text();

      if (this.useCache) {
        const localPath = getLocalCacheName(this.params.cache);
        await fs.mkdirs(path.dirname(localPath));
        await fs.writeFile(localPath, html);
      }

      return html;
    }
  }

  async get(url) {
    const html = await this.download(url);

    if (html) {
      const { document } = new JSDOM(DOMUtils.removeNoscripts(html.toString())).window;
      this.preProcess(document);
      return {
        document,
        html,
      };
    }

    return null;
  }

  async import(url, entryParams) {
    const startTime = new Date().getTime();

    const { document, html } = await this.get(url);

    const results = [];
    if (document) {
      const entries = await this.process(document, url, entryParams, html);

      this.postProcess(document);

      if (entries) {
        await Utils.asyncForEach(entries, async (entry) => {
          if (entry.document) {
            const res = await this.createMarkdown(entry, url);
            // eslint-disable-next-line no-param-reassign
            entry.source = url;
            // eslint-disable-next-line no-param-reassign
            entry.path = res.path;
            // eslint-disable-next-line no-param-reassign
            entry.markdown = res.content;

            if (!this.params.skipMDFileCreation) {
              const mdPath = `${res.path}.md`;
              await this.params.storageHandler.put(mdPath, res.content);
              this.logger.log(`MD file created: ${mdPath}`);

              // eslint-disable-next-line no-param-reassign
              entry.md = mdPath;
            }

            if (!this.params.skipDocxConversion) {
              const docxPath = `${res.path}.docx`;
              await this.convertToDocx(docxPath, res.content);
              // eslint-disable-next-line no-param-reassign
              entry.docx = docxPath;
            }
          }

          results.push(entry);
        });
      }
    }

    this.logger.log('');
    this.logger.log(`${url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  fetch() {}

  process() {}
}
