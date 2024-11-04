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
import { encodeHTMLEntities, toMetaName } from '../utils.js';

const IMAGE_URL_REGEX = /https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|svg|webp|tiff|ico)(\?.*)?$/i;

const metadataFields = ['description'];
const aemMapping = {
  'jcr:description': 'description',
  'cq:canonicalUrl': 'canonical',
  'cq:robotsTags': 'robots',
};

function toPropertyName(name) {
  const lowerCaseName = name.toLowerCase();
  const index = metadataFields.findIndex((field) => field.toLowerCase() === lowerCaseName);
  if (index !== -1) {
    return metadataFields[index];
  }
  return name;
}

function isMultiValueField(name, componentModels) {
  const pageMetadata = componentModels?.find((component) => component.id === 'page-metadata');
  if (pageMetadata) {
    const field = pageMetadata.fields.find((f) => f.name === name);
    return field && (field.component === 'multiselect' || field.component === 'aem-tag' || field.component === 'checkbox' || field.multi);
  }
  return false;
}

function addMetadataFields(componentModels) {
  if (!componentModels) {
    return;
  }
  const pageMetadata = componentModels.find((component) => component.id === 'page-metadata');
  if (pageMetadata) {
    metadataFields.push(...pageMetadata.fields.map((field) => field.name));
  }
}

function getImageAttribute(attributes) {
  // iterate over all attributes and return the first one that is an image
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'image' || key.endsWith('_image') || key.endsWith(':image') || IMAGE_URL_REGEX.test(value)) {
      return { key, value };
    }
  }
  return null;
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
      let finalContent = encodeHTMLEntities(content);
      if (isMultiValueField(name || property, componentModels)) {
        finalContent = content.split(',').map((value) => encodeHTMLEntities(value.trim()));
        finalContent = finalContent.length > 0 ? `[${finalContent.join(',')}]` : '';
      }
      for (const [key, value] of Object.entries(aemMapping)) {
        if (name === value || property === value) {
          return { ...acc, [key]: finalContent };
        }
      }
      const propertyName = toPropertyName(name || property);
      return { ...acc, [propertyName]: finalContent };
    }, {});
    if ($title) {
      metaAttributes = { 'jcr:title': encodeHTMLEntities(toString($title)), ...metaAttributes };
    }
    return {
      ...metaAttributes,
    };
  },
  insert: (parent, nodeName, component) => {
    const content = parent.elements.find((element) => element.name === nodeName);
    if (content) {
      content.attributes = { ...content.attributes, ...component };
      // if the metadata contains a page image, add it as a child node
      const imageAttribute = getImageAttribute(content.attributes);
      if (imageAttribute) {
        const imageNode = {
          type: 'element',
          name: 'image',
          attributes: {
            'jcr:primaryType': 'nt:unstructured',
            fileReference: imageAttribute.value,
          },
        };
        content.elements.push(imageNode);
        delete content.attributes[imageAttribute.key];
      }
    }
  },
};

export default metadata;
