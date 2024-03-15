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

import path from 'path';
import { unified } from 'unified';
import parse from 'rehype-parse';
import { defaultHandlers, toMdast } from 'hast-util-to-mdast';
import stringify from 'remark-stringify';
import fs from 'fs-extra';
import { md2docx } from '@adobe/helix-md2docx';
import remarkGridTable from '@adobe/remark-gridtables';
import {
  imageReferences,
  remarkGfmNoLink,
  sanitizeHeading,
  sanitizeLinks,
  sanitizeTextAndFormats,
  suppressSpaceCode,
} from '@adobe/helix-markdown-support';
import gridtableHandlers from './hast-to-mdast-gridtable-handlers.js';
import Utils from '../utils/Utils.js';
import DOMUtils from '../utils/DOMUtils.js';
import FileUtils from '../utils/FileUtils.js';
import MDUtils from '../utils/MDUtils.js';
import formatPlugin from './mdast-to-md-format-plugin.js';
import BrowserUtils from '../utils/BrowserUtils.js';

function formatNode(type, state, node) {
  const result = {
    type,
    children: state.all(node),
  };
  state.patch(node, result);
  return result;
}

export default class PageImporter {
  params;

  logger;

  useCache;

  constructor(params) {
    this.params = params;

    if (!this.params.createDocumentFromString) {
      // default the string parsing using the browser DOMParser
      this.params.createDocumentFromString = BrowserUtils.createDocumentFromString;
    }

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

    const html = resource.document.innerHTML;
    const hast = await unified()
      .use(parse, { emitParseErrors: true })
      .parse(html);

    const mdast = toMdast(hast, {
      handlers: {
        ...defaultHandlers,
        u: (state, node) => formatNode('underline', state, node),
        sub: (state, node) => formatNode('subscript', state, node),
        sup: (state, node) => formatNode('superscript', state, node),
        ...gridtableHandlers,
      },
    });

    // cleanup mdast similar to docx2md
    await sanitizeHeading(mdast);
    await sanitizeLinks(mdast);
    await sanitizeTextAndFormats(mdast);
    await suppressSpaceCode(mdast);
    await imageReferences(mdast);

    let md = await unified()
      .use(stringify, {
        strong: '*',
        emphasis: '_',
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        rule: '-',
        ruleRepetition: 3,
        ruleSpaces: false,
      })
      .use(remarkGridTable)
      .use(remarkGfmNoLink)
      .use(formatPlugin) // this converts the `underline` and `subscript` back to tags in the md.
      .stringify(mdast);

    // process image links
    // TODO: this can be done easier in the MDAST tree
    const { document } = resource;
    const assets = [];
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      const { src } = img;
      const isEmbed = img.classList.contains('hlx-embed');
      if (!isEmbed && src && src !== '' && (md.indexOf(src) !== -1 || md.indexOf(decodeURI(src)) !== -1)) {
        assets.push({
          url: src,
          append: '#image.png',
        });
      }
    });

    const as = document.querySelectorAll('a');
    as.forEach((a) => {
      const { href } = a;
      try {
        if ((href && href !== '' && md.indexOf(href) !== -1) || md.indexOf(decodeURI(href)) !== -1) {
          const u = new URL(href, url);
          const ext = path.extname(u.href);
          if (ext === '.mp4') {
            // upload mp4
            assets.push({
              url: href,
              append: '#image.mp4',
            });
          }
        }
      } catch (error) {
        this.logger.warn(`Invalid link in the page - ${href}`, error);
      }
    });

    const vs = document.querySelectorAll('video source');
    vs.forEach((s) => {
      const { src } = s;
      if ((src && src !== '' && md.indexOf(src) !== -1) || md.indexOf(decodeURI(src)) !== -1) {
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
      md = MDUtils.replaceSrcInMarkdown(md, asset.url, u.toString());
    });

    if (resource.prepend) {
      md = resource.prepend + md;
    }

    md = this.postProcessMD(md);

    return {
      path: path.join(directory, sanitizedName),
      content: md,
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
      // try to handle b64 img
      if (!src || src.indexOf('data:') === 0) {
        const dataUrl = DOMUtils.getDataUrlFromB64Img(img.src);
        if (dataUrl) {
          img.setAttribute('src', dataUrl);
        } else {
          img.remove();
        }
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
      const cleanedHTML = DOMUtils.removeNoscripts(html.toString());

      const document = this.params.createDocumentFromString(cleanedHTML);
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
      this.preProcess(document);

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
