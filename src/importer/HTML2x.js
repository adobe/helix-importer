/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable class-methods-use-this, no-console */

import path from 'path';
import { Response } from 'node-fetch';
import { JSDOM } from 'jsdom';
import PageImporter from './PageImporter.js';
import PageImporterResource from './PageImporterResource.js';
import MemoryHandler from '../storage/MemoryHandler.js';

// import docxStylesXML from '../resources/styles.xml';

function preprocessDOM(document) {
  const elements = document.querySelectorAll('body, header, footer, div, span, section, main');
  const getComputedStyle = document.defaultView?.getComputedStyle;
  if (getComputedStyle) {
    elements.forEach((element) => {
      // css background images will be lost -> write them in the DOM
      const style = getComputedStyle(element);
      if (style['background-image'] && style['background-image'].toLowerCase() !== 'none') {
        // eslint-disable-next-line no-param-reassign
        element.style['background-image'] = style['background-image'];
      }
    });
  }
}

// eslint-disable-next-line no-unused-vars
async function defaultTransformDOM({ url, document, html }) {
  return document.body;
}

// eslint-disable-next-line no-unused-vars
async function defaultGenerateDocumentPath({ url, document }) {
  let p = new URL(url).pathname;
  if (p.endsWith('/')) {
    p = `${p}index`;
  }
  return decodeURIComponent(p)
    .toLowerCase()
    .replace(/\.html$/, '')
    .replace(/[^a-z0-9/]/gm, '-');
}

async function html2x(url, doc, transformCfg, toMd, toDocx, options = {}) {
  let name = 'index';
  let dirname = '';

  const transfrom = transformCfg || {};

  if (!transfrom.transformDOM) {
    transfrom.transformDOM = defaultTransformDOM;
  }

  if (!transfrom.generateDocumentPath) {
    transfrom.generateDocumentPath = defaultGenerateDocumentPath;
  }

  if (options.preprocess !== false) {
    preprocessDOM(doc);
  }

  const html = doc.documentElement.outerHTML;
  class InternalImporter extends PageImporter {
    async fetch() {
      return new Response(html);
    }

    async process(document) {
      let output = await transfrom.transformDOM({ url, document, html });
      output = output || document.body;

      let p = await transfrom.generateDocumentPath({ url, document });
      if (!p) {
        // provided function returns null -> apply default
        p = await defaultGenerateDocumentPath({ url, document });
      }

      name = path.basename(p);
      dirname = path.dirname(p);

      const pir = new PageImporterResource(name, dirname, output, null, {
        html: output.outerHTML,
      });
      return [pir];
    }
  }

  const logger = {
    debug: () => {},
    info: () => {},
    log: () => {},
    warn: (...args) => console.error(...args),
    error: (...args) => console.error(...args),
  };

  const storageHandler = new MemoryHandler(logger);
  const importer = new InternalImporter({
    storageHandler,
    skipDocxConversion: !toDocx,
    skipMDFileCreation: !toMd,
    logger,
    mdast2docxOptions: {
      stylesXML: options.docxStylesXML,
      svg2png: options.svg2png,
    },
  });

  const pirs = await importer.import(url);

  const res = {
    html: pirs[0].extra.html,
  };

  res.path = `${dirname}${name}`;

  if (toMd) {
    const md = await storageHandler.get(pirs[0].md);
    res.md = md;
  }
  if (toDocx) {
    const docx = await storageHandler.get(pirs[0].docx);
    res.docx = docx;
  }
  return res;
}

async function html2md(url, document, transformCfg, options = {}) {
  let doc = document;
  if (typeof document === 'string') {
    doc = new JSDOM(document, { runScripts: undefined }).window.document;
  }
  return html2x(url, doc, transformCfg, true, false, options);
}

async function html2docx(url, document, transformCfg, options = {}) {
  let doc = document;
  if (typeof document === 'string') {
    doc = new JSDOM(document, { runScripts: undefined }).window.document;
  }
  return html2x(url, doc, transformCfg, true, true, options);
}

export {
  html2md,
  html2docx,
  defaultTransformDOM,
  defaultGenerateDocumentPath,
};
