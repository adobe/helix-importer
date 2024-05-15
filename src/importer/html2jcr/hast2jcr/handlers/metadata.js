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

import { select } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toMetaName } from '../utils.js';

const metadataFields = ['description'];

function addMetadataFields(componentModels) {
  if (!componentModels) {
    return;
  }
  const pageMetadata = componentModels.find((component) => component.id === 'page-metadata');
  if (pageMetadata) {
    metadataFields.push(...pageMetadata.fields.map((field) => field.name));
  }
}
const metadata = {
  use: (node) => node.tagName === 'head',
  getAttributes: (node, ctx) => {
    const { componentModels } = ctx;
    addMetadataFields(componentModels);
    const metaNameFields = metadataFields.map((field) => toMetaName(field));
    const $title = select('title', node);
    const meta = node.children.filter((child) => child.tagName === 'meta');
    let metaAttributes = meta.reduce((acc, child) => {
      const { name, property, content } = child.properties;
      if (metaNameFields.indexOf(name) === -1 && metaNameFields.indexOf(property) === -1) {
        return acc;
      }
      if (name === 'description') {
        return { ...acc, 'jcr:description': content };
      }
      return { ...acc, [name || property]: content };
    }, {});
    if ($title) {
      metaAttributes = { 'jcr:title': toString($title), ...metaAttributes };
    }
    return {
      ...metaAttributes,
    };
  },
  insert: (parent, nodeName, component) => {
    const content = parent.elements.find((element) => element.name === nodeName);
    if (content) {
      content.attributes = { ...content.attributes, ...component };
    }
  },
};

export default metadata;
