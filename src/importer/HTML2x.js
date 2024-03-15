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
import PageImporter from './PageImporter.js';
import PageImporterResource from './PageImporterResource.js';
import MemoryHandler from '../storage/MemoryHandler.js';
import Utils from '../utils/Utils.js';
import BrowserUtils from '../utils/BrowserUtils.js';
import defaultTransformDOM from './defaults/transformDOM.js';
import defaultGenerateDocumentPath from './defaults/generateDocumentPath.js';

// import docxStylesXML from '../resources/styles.xml';

function setBackgroundImagesFromCSS(document) {
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

async function html2x(
  url,
  doc,
  transformCfg,
  config = { toMd: true, toDocx: false },
  params = {},
) {
  const transformer = transformCfg || {};

  if (!transformer.transform) {
    if (!transformer.transformDOM) {
      transformer.transformDOM = defaultTransformDOM;
    }

    if (!transformer.generateDocumentPath) {
      transformer.generateDocumentPath = defaultGenerateDocumentPath;
    }
  }

  // for more advanced use cases, give access to the original dom with
  // no preprocessing at all
  if (transformer.preprocess) {
    await transformer.preprocess({
      url,
      document: doc,
      html: doc.documentElement.outerHTML,
      params,
    });
  }

  if (config.setBackgroundImagesFromCSS !== false) {
    setBackgroundImagesFromCSS(doc);
  }

  const html = doc.documentElement.outerHTML;
  class InternalImporter extends PageImporter {
    async get() {
      return { document: doc, html };
    }

    async process(document) {
      if (transformer.transform) {
        let results = await transformer.transform({
          url,
          document,
          html,
          params,
        });
        if (!results) return null;
        const pirs = [];

        if (!Array.isArray(results)) {
          // single element with transform function
          results = [results];
        }

        results.forEach((result) => {
          const name = path.basename(result.path);
          const dirname = path.dirname(result.path);
          const extra = {};

          if (result.element) {
            extra.html = result.element.outerHTML;
          } else if (result.from) {
            extra.from = result.from;
          }

          if (result.report) {
            extra.report = result.report;
          }

          const pir = new PageImporterResource(name, dirname, result.element, null, extra);
          pirs.push(pir);
        });
        return pirs;
      } else {
        let output = await transformer.transformDOM({
          url,
          document,
          html,
          params,
        });
        output = output || document.body;

        let p = await transformer.generateDocumentPath({
          url,
          document,
          html,
          params,
        });
        if (!p) {
          // provided function returns null -> apply default
          p = await defaultGenerateDocumentPath({ url, document });
        }

        const name = path.basename(p);
        const dirname = path.dirname(p);

        const pir = new PageImporterResource(name, dirname, output, null, {
          html: output.outerHTML,
        });
        return [pir];
      }
    }
  }

  const logger = {
    debug: () => {},
    info: () => {},
    log: () => {},
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
  };

  const storageHandler = new MemoryHandler(logger);
  const importer = new InternalImporter({
    storageHandler,
    skipDocxConversion: !config.toDocx,
    skipMDFileCreation: !config.toMd,
    logger,
    mdast2docxOptions: {
      stylesXML: config.docxStylesXML,
      image2png: config.image2png,
    },
    createDocumentFromString: config.createDocumentFromString,
  });

  const pirs = await importer.import(url);

  const getResponseObjectFromPIR = async (pir) => {
    const res = {};

    if (pir.extra && pir.extra.html) {
      res.html = pir.extra.html;
    }

    if (pir.extra.from) {
      res.from = pir.extra.from;
    }

    if (pir.extra.report) {
      res.report = pir.extra.report;
    }

    res.path = path.resolve(pir.directory, pir.name);

    if (config.toMd && pir.md) {
      const md = await storageHandler.get(pir.md);
      res.md = md;
    }
    if (config.toDocx && pir.docx) {
      const docx = await storageHandler.get(pir.docx);
      res.docx = docx;
    }
    return res;
  };

  if (pirs.length === 1) {
    return getResponseObjectFromPIR(pirs[0]);
  } else {
    const res = [];
    await Utils.asyncForEach(pirs, async (pir) => {
      res.push(await getResponseObjectFromPIR(pir));
    });
    return res;
  }
}

const parseStringDocument = (html, config) => {
  if (config?.createDocumentFromString) {
    return config.createDocumentFromString(html);
  } else {
    return BrowserUtils.createDocumentFromString(html);
  }
};

/**
 * Returns the result of the conversion from html to md.
 * @param {string} url URL of the document to convert
 * @param {Document} document Document to convert
 * @param {Object} transformCfg Conversion configuration
 * @param {Object} config Conversion configuration.
 * @param {Object} params Conversion params. Object will be pass to the transformer functions.
 * @returns {Object|Array} Result(s) of the conversion
 */
async function html2md(url, document, transformCfg, config, params = {}) {
  let doc = document;
  if (typeof doc === 'string') {
    doc = parseStringDocument(document, config);
  }
  return html2x(url, doc, transformCfg, { ...config, toMd: true, toDocx: false }, params);
}

/**
 * Returns the result of the conversion from html to docx.
 * @param {string} url URL of the document to convert
 * @param {HTMLElement|string} document Document to convert
 * @param {Object} transformCfg Conversion configuration
 * @param {Object} config Conversion configuration.
 * @param {Object} params Conversion params. Object will be pass to the transformer functions.
 * @returns {Object|Array} Result(s) of the conversion
 */
async function html2docx(url, document, transformCfg, config, params = {}) {
  let doc = document;
  if (typeof doc === 'string') {
    doc = parseStringDocument(document, config);
  }
  return html2x(url, doc, transformCfg, { ...config, toMd: true, toDocx: true }, params);
}

export {
  html2md,
  html2docx,
  defaultTransformDOM,
  defaultGenerateDocumentPath,
};
