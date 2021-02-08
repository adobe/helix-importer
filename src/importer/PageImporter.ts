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

 /* tslint:disable: no-console */

import Importer from './Importer';
import PageImporterParams from './PageImporterParams';
import PageImporterResource from './PageImporterResource';

import FileUtils from '../utils/FileUtils';
import DOMUtils from '../utils/DOMUtils';
import Utils from '../utils/Utils';

import { Response } from 'node-fetch';
import { JSDOM, Document } from 'jsdom';

import path from 'path';
import unified from 'unified';
import parse from 'rehype-parse';
import rehype2remark from 'rehype-remark';
import stringify from 'remark-stringify';
import all from 'hast-util-to-mdast/lib/all';
import fs from 'fs-extra';

export default abstract class PageImporter implements Importer {
  params: PageImporterParams;
  logger: any;
  useCache: boolean;

  constructor(params: PageImporterParams) {
      this.params = params;
      this.logger = console;

      this.useCache = !!params.cache;
  }

  async upload(src) {
    let blob;

    try {
      blob = await this.params.blobHandler.getBlob(src);
    } catch (error) {
      // ignore non exiting images, otherwise throw an error
      if (error.message.indexOf('StatusCodeError: 404') === -1) {
        this.logger.error(`Cannot upload blob for ${src}: ${error.message}`);
        throw new Error(`Cannot upload blob for ${src}: ${error.message}`);
      }
    }

    if (blob) {
      return blob.uri;
    } else {
      this.logger.error(`Asset could not be uploaded to blob handler: ${src}`);
    }
    return src;
  }

  async createMarkdownFile(resource: PageImporterResource, url: string) {
    const name = resource.name;
    const directory = resource.directory;
    const sanitizedName = FileUtils.sanitizeFilename(name);
    this.logger.log(`Creating a new MD file: ${directory}/${sanitizedName}.md`);

    const processor = unified()
      .use(parse, { emitParseErrors: true})
      .use(rehype2remark, {
        handlers: {
          hlxembed: (h, node) => h(node, 'hlxembed', node.children[0].value),
          u: (h, node) => h(node, 'u', all(h, node)),
        },
      })
      .use(stringify, {
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        rule: '-',
        ruleRepetition: 3,
        ruleSpaces: false,
      })
      .use(() => {
        // use custom tag and rendering because text is always encoded by default
        // we need the raw url
        processor.Compiler.prototype.visitors.hlxembed = (node) => node.value;
      })
      .use(() => {
        processor.Compiler.prototype.visitors.u = (node) => {
          // u handling: remove the u is the first element is a link
          if (node.children && node.children.length > 0) {
            const children = node.children.map((child) => processor.stringify(child));
            if (node.children[0].type === 'link') {
              // first element in the <u> is a link: remove the <u> - unsupported case
              return `${children.join()}`;
            }
            return `<u>${children.join()}</u>`;
          }
          return '';
        };
      })
      .use(() => {
        const originalEmphasis = processor.Compiler.prototype.visitors.emphasis;
        processor.Compiler.prototype.visitors.emphasis = (node) => {
          // @ts-ignore
          const ori = originalEmphasis.apply(processor.Compiler(), [node]);
          return ori;
        };
      });

    const file = await processor.process(resource.document.innerHTML);
    const p = `${directory}/${sanitizedName}.md`;
    let contents = file.contents.toString();

    // process image links
    const document = resource.document;
    const assets = [];
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      const { src } = img;
      const isEmbed = img.classList.contains('hlx-embed');
      if (!isEmbed && src && src !== '' && (contents.indexOf(src) !== -1 || contents.indexOf(decodeURI(src)) !== -1)) {
        assets.push({
          url: src
        });
      }
    });

    const as = document.querySelectorAll('a');
    as.forEach(a => {
      const { href } = a;
      if (href && href !== '' && (contents.indexOf(href) !== -1) || contents.indexOf(decodeURI(href)) !== -1) {
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
          this.logger.warn(`Invalid link in the page: ${href}`);
        }
      }
    });

    const vs = document.querySelectorAll('video source');
    vs.forEach(s => {
      const { src } = s;
      if (src && src !== '' && (contents.indexOf(src) !== -1) || contents.indexOf(decodeURI(src)) !== -1) {
        try {
          const u = new URL(src, url);
          const ext = path.extname(u.href);
          if (ext === '.mp4') {
            const poster = s.parentNode.getAttribute('poster');
            if (poster) {
              assets.push({
                url: poster
              });
            }
            // upload mp4
            assets.push({
              url: src,
              append: '#image.mp4',
            });
          }
        } catch (error) {
          this.logger.warn(`Invalid video in the page: ${src}`);
        }
      }
    });

    // upload all assets
    await Utils.asyncForEach(assets, async (asset) => {
      const u = new URL(decodeURI(asset.url), url);
      let newSrc = await this.upload(u.href);
      if (asset.append) {
        newSrc = `${newSrc}${asset.append}`
      }
      contents = contents
        .replace(new RegExp(`${asset.url.replace('.', '\\.').replace('?', '\\?')}`, 'gm'), newSrc)
        .replace(new RegExp(`${decodeURI(asset.url).replace('.', '\\.')}`, 'gm'), newSrc);
    });

    if (resource.prepend) {
      contents = resource.prepend + contents;
    }

    contents = this.postProcessMD(contents);

    await this.params.storageHandler.put(p, contents);
    this.logger.log(`MD file created: ${p}`);

    return p;
  }

  cleanup(document: Document) {
    DOMUtils.remove(document, ['script', 'hr']);
    DOMUtils.removeComments(document);
    DOMUtils.removeSpans(document);
  }

  preProcess(document: Document) {
    this.cleanup(document);
    DOMUtils.reviewHeadings(document);
    DOMUtils.reviewParagraphs(document);
    DOMUtils.escapeSpecialCharacters(document);
    ['b', 'a', 'big', 'code', 'em', 'i', 'label', 's', 'small', /*'span'*/, 'strong', 'sub', 'sup', 'u', 'var']
      .forEach((tag) => DOMUtils.reviewInlineElement(document, tag));

    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      let src = img.getAttribute('src');
      const ori = src;
      const dataSrc = img.getAttribute('data-src');
      if (!src && dataSrc) {
        // lazy loading case
        img.setAttribute('src', dataSrc);
      }

      if (dataSrc && src.indexOf('data:') === 0) {
        // b64 img, try replace with dataSrc
        img.setAttribute('src', dataSrc);
      }

      src = img.getAttribute('src');
      if (!src || src.indexOf('data:') === 0) {
        // we cannot handle b64 asset for now, remove
        img.remove();
      }
    });
  }

  postProcess(document: Document) {
    DOMUtils.encodeImagesForTable(document);
  }

  postProcessMD(md: string): string {
    return md
      .replace(/\\\\\~/gm, '\\~');
  }

  async download(url: string): Promise<string> {
    const getLocalCacheName = (p) => {
      return path.resolve(p, `${new URL(url).pathname.replace(/^\/+|\/+$/g, '').replace(/\//gm, '_')}.html`);
    };

    if (this.useCache) {
      const localPath = getLocalCacheName(this.params.cache);
      if (await fs.exists(localPath)) {
        return fs.readFile(localPath);
      }
    }

    const res = await this.fetch(url);
    if (!res.ok) {
      this.logger.error(`${url}: Invalid response`, res);
      throw new Error(`${url}: Invalid response - ${res.statusText}`)
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

  async get(url: string): Promise<any> {
    const html = await this.download(url);

    if (html) {
      const { document } = (new JSDOM(DOMUtils.removeNoscripts(html.toString()))).window;
      this.preProcess(document);
      return {
        document,
        html,
      };
    }

    return null;
  }

  async import(url: string, entryParams?: object) {
    const startTime = new Date().getTime();

    const { document, html } = await this.get(url);

    const results = [];
    if (document) {
      const entries = await this.process(document, url, entryParams, html);

      this.postProcess(document);

      await Utils.asyncForEach(entries, async (entry) => {
        const file = await this.createMarkdownFile(entry, url);
        entry.source = url;
        entry.file = file;
        results.push(entry);
      });
    }

    this.logger.log('');
    this.logger.log(`${url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  abstract fetch(url: string): Promise<Response>;
  abstract process(document: Document, url: string, entryParams?: object, raw?: string): Promise<PageImporterResource[]>;
}