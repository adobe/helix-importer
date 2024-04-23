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
import { findFieldsById } from '../utils.js';

const resourceType = 'core/franklin/components/section/v1/section';

function createMetadata(node, ctx) {
  const data = {};
  const rows = node.children.filter((row) => row.tagName === 'div');
  // eslint-disable-next-line no-restricted-syntax
  for (const row of rows) {
    const columns = row.children.filter((column) => column.tagName === 'div');
    if (columns.length !== 2) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const key = columns[0]?.children[0]?.value;
    const value = columns[1]?.children[0]?.value;
    if (key && value) {
      data[key] = value;
    }
  }
  if (data.model) {
    const { model } = data;
    const { componentModels } = ctx;
    const fields = findFieldsById(componentModels, model);
    if (fields) {
      for (const field of fields) {
        if (field.component === 'multiselect' && data[field.name]) {
          const multiselectValues = data[field.name].split(',');
          data[field.name] = `[${multiselectValues.map((value) => `${value.trim()}`).join(', ')}]`;
        }
      }
    }
  }
  return data;
}

function getMetaData(node, ctx) {
  const data = {};
  const { parents } = ctx;
  if (!parents) {
    return data;
  }
  const parent = node.tagName === 'hr' ? parents[parents.length - 1] : node;
  let currentSectionNode = node.tagName === 'div' ? node : null;

  const result = parent.children.find((child) => {
    if (child.tagName === 'hr') {
      currentSectionNode = child;
    }
    if (child.properties?.className?.includes('section-metadata')) {
      return currentSectionNode === node;
    }
    return false;
  });

  return result ? createMetadata(result, ctx) : data;
}

const section = {
  use: (node, parents) => {
    if (node.tagName === 'div') {
      if (parents && parents[parents.length - 1]?.tagName === 'main') {
        return true;
      }
    } else if (node.tagName === 'hr') {
      return true;
    }
    return false;
  },
  getAttributes: (node, ctx) => {
    const metaData = getMetaData(node, ctx);
    return {
      rt: resourceType,
      ...metaData,
    };
  },
};

export default section;
