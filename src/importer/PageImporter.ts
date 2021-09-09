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
import remark from 'remark-parse';
import gfm from 'remark-gfm';
import { remarkMatter } from '@adobe/helix-markdown-support';
import mdast2docx from '@adobe/helix-word2md/src/mdast2docx';

export default abstract class PageImporter implements Importer {
  params: PageImporterParams;
  logger: any;
  useCache: boolean;

  constructor(params: PageImporterParams) {
    this.params = params;
    this.logger = params.logger || console;

    this.useCache = !!params.cache;
  }

  async upload(src) {
    let blob;

    let retry = 3;
    do {
      try {
        blob = await this.params.blobHandler.getBlob(src);
        retry = 0;
      } catch (error) {
        retry--;
        if (retry === 0) {
          // ignore non exiting images, otherwise throw an error
          if (error.message.indexOf('StatusCodeError: 404') === -1) {
            this.logger.error(`Cannot upload blob after 3 retries for ${src}: ${error.message}`);
            throw new Error(`Cannot upload blob after 3 retries for ${src}: ${error.message}`);
          }
        }
      }
    } while (retry > 0);

    if (blob) {
      return blob.uri;
    } else {
      this.logger.error(`Asset could not be uploaded to blob handler: ${src}`);
    }
    return src;
  }

  async convertToDocx(file) {
    const { path: p, content } = file;
    const docx = p.replace(/\.md$/, '.docx');

    const mdast = unified()
      .use(remark as any, { position: false })
      .use(gfm as any)
      .use(remarkMatter)
      .parse(content);

    const buffer = await mdast2docx(mdast);
    await this.params.storageHandler.put(docx, buffer);
    return docx;
  }

  async createMarkdownFile(resource: PageImporterResource, url: string) {
    const name = resource.name;
    const directory = resource.directory;
    const sanitizedName = FileUtils.sanitizeFilename(name);
    this.logger.log(`Creating a new MD file: ${directory}/${sanitizedName}.md`);

    const processor = unified()
      .use(parse, { emitParseErrors: true })
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
    imgs.forEach((img) => {
      const { src } = img;
      const isEmbed = img.classList.contains('hlx-embed');
      if (!isEmbed && src && src !== '' && (contents.indexOf(src) !== -1 || contents.indexOf(decodeURI(src)) !== -1)) {
        assets.push({
          url: src,
          append: '#image.png'
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
          this.logger.warn(`Invalid link in the page: ${href}`);
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
          this.logger.warn(`Invalid video in the page: ${src}`);
        }
      }
    });

    const patchSrcInContent = (c, oldSrc, newSrc) => {
      return contents
            .replace(new RegExp(`${oldSrc.replace('.', '\\.').replace('?', '\\?')}`, 'gm'), newSrc)
            .replace(new RegExp(`${decodeURI(oldSrc).replace('.', '\\.')}`, 'gm'), newSrc);
    }

    if (!this.params.skipAssetsUpload) {
      // upload all assets
      const current = this;
      await Promise.all(assets.map((asset) => {
        const u = new URL(decodeURI(asset.url), url);
        return current.upload(u.href).then(newSrc => {
          if (asset.append) {
            newSrc = `${newSrc}${asset.append}`;
          }
          contents = patchSrcInContent(contents, asset.url, newSrc);
        });
      }));
    } else {
      // still need to adjust assets url (from relative to absolute)
      assets.forEach((asset) => {
        const u = new URL(decodeURI(asset.url), url);
        contents = patchSrcInContent(contents, asset.url, u.toString());
      });
    }

    if (resource.prepend) {
      contents = resource.prepend + contents;
    }

    contents = this.postProcessMD(contents);

    await this.params.storageHandler.put(p, contents);
    this.logger.log(`MD file created: ${p}`);

    return {
      path: p,
      content: contents
    };
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
    [
      'b',
      'a',
      'big',
      'code',
      'em',
      'i',
      'label',
      's',
      'small',
      /*'span'*/,
      'strong',
      'sub',
      'sup',
      'u',
      'var',
    ].forEach((tag) => DOMUtils.reviewInlineElement(document, tag));

    // u a tag combo is not handled properly by unified js and is discouraged anyway -> remove the u
    document.querySelectorAll('u > a').forEach(a => {
      const p = a.parentNode;
      p.before(a);
      p.remove();
    });

    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
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

      const alt = img.getAttribute('alt');
      const title = img.getAttribute('title');
      if (title  && title === alt) {
        // a11y: image title has little value if it's the same than the alt text.
        img.removeAttribute('title');
      }
    });
  }

  postProcess(document: Document) {
    DOMUtils.encodeImagesForTable(document);
  }

  postProcessMD(md: string): string {
    let ret = md.replace(/\\\\\~/gm, '\\~');
    
    const match = ret.match(/hlx_replaceTag\(.*?\)/gm);
    if (match) {
      const hlxReplaceTags = match.filter((i, p, s) => s.indexOf(i) === p);
      hlxReplaceTags.forEach(r => {
        const by = r.substring(0, r.length -1).split('(')[1];
        const regex = new RegExp(r.replace('(', '\\(').replace(')', '\\)'), 'gm');
        ret = ret.replace(regex, `<${by}>`);
      });
    }
        
    return ret;
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

  async get(url: string): Promise<any> {
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
        entry.file = file.path; // deprecated
        entry.md = file.path;

        if (!this.params.skipDocxConversion) {
          const docx = await this.convertToDocx(file);
          entry.docx = docx;
        }
        
        results.push(entry);
      });
    }

    this.logger.log('');
    this.logger.log(`${url}: Process took ${(new Date().getTime() - startTime) / 1000}s.`);

    return results;
  }

  abstract fetch(url: string): Promise<Response>;
  abstract process(
    document: Document,
    url: string,
    entryParams?: object,
    raw?: string,
  ): Promise<PageImporterResource[]>;
}
