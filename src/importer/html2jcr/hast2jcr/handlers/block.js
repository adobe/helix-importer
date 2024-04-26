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
import { select, selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';
import button, { getType } from './button.js';
import { encodeHTMLEntities, getHandler, findFieldsById } from '../utils.js';

function findNameFilterById(componentDefinition, nameClass) {
  let model = null;
  let filterId = null;
  let name = null;
  componentDefinition.groups.forEach((group) => {
    group.components.forEach((component) => {
      const templateName = component?.plugins?.xwalk?.page?.template?.name;
      if (templateName && templateName.toLowerCase()
        .trim()
        .replace(/[^0-9a-z]+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') === nameClass) {
        filterId = component?.plugins?.xwalk?.page?.template?.filter;
        model = component?.plugins?.xwalk?.page?.template?.model;
        name = templateName;
      }
    });
  });
  return { name, filterId, model };
}

function findFilterById(filters, id) {
  let filter = null;
  filters.forEach((item) => {
    if (item.id === id) {
      if (item?.components?.length > 0) {
        filter = item?.components[0];
      }
    }
  });
  return filter;
}

function encodeHtml(str) {
  return str.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/>[\s]*&lt;/g, '>&lt;');
}

function collapseField(id, fields, properties, node) {
  /* eslint-disable no-param-reassign */
  const suffixes = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];
  suffixes.forEach((suffix) => {
    const field = fields.find((f) => f.name === `${id}${suffix}`);
    if (field) {
      if (suffix === 'Type') {
        if (node?.tagName.startsWith('h')) {
          properties[field.name] = node?.tagName?.toLowerCase();
        } else if (button.use(node)) {
          properties[field.name] = getType(node);
        }
      } else if (button.use(node)) {
        if (suffix === 'Text') {
          properties[field.name] = encodeHTMLEntities(select('a', node)?.children?.[0]?.value);
        } else {
          properties[field.name] = encodeHTMLEntities(select('a', node)?.properties?.[suffix.toLowerCase()]);
        }
      } else {
        properties[field.name] = encodeHTMLEntities(node?.properties?.[suffix.toLowerCase()]);
      }
      fields.filter((value, index, array) => {
        if (value.name === `${id}${suffix}`) {
          array.splice(index, 1);
          return true;
        }
        return false;
      });
    }
  });
}

function getMainFields(fields) {
  const suffixes = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];
  const itemNames = fields.map((item) => item.name);

  return fields.filter((item) => {
    const itemNameWithoutSuffix = suffixes.reduce((name, suffix) => {
      if (name.endsWith(suffix)) {
        return name.slice(0, -suffix.length);
      }
      return name;
    }, item.name);

    return !(itemNames.includes(itemNameWithoutSuffix) && itemNameWithoutSuffix !== item.name);
  });
}

function createComponentGroups(fields) {
  const components = [];
  if (!fields) {
    return components;
  }
  fields.forEach((obj) => {
    if (obj.name.includes('_')) {
      const groupName = obj.name.split('_')[0];
      let groupObj = components.find((item) => item.name === groupName);
      if (!groupObj) {
        groupObj = {
          component: 'group',
          name: groupName,
          fields: [],
        };
        components.push(groupObj);
      }
      groupObj.fields.push(obj);
    } else {
      components.push(obj);
    }
  });
  return components;
}

function isHeadline(field, fields) {
  return field.component === 'text' && fields.find((f) => f.name === `${field.name}Type`);
}

function findFieldByType(handler, groupFields, fields, idx) {
  let groupField = null;
  let gIdx = idx;
  for (let index = gIdx; index < groupFields.length; index += 1) {
    const field = groupFields[index];
    if ((field.component === handler.name && !isHeadline(field, fields))
      || (isHeadline(field, fields) && handler.name === 'title')
      || (field.component === 'richtext' && handler.name === 'text')
      || (field.component === 'multiselect' && handler.name === 'text')
      || (field.component === 'reference' && handler.name === 'button')
      || (field.component === 'reference' && handler.name === 'image')) {
      groupField = field;
      if (field.component === 'richtext' && handler.name === 'text') {
        gIdx = index;
      } else {
        gIdx = index + 1;
      }

      break;
    }
  }
  return { gIdx, groupField };
}

function extractProperties(node, id, ctx, mode = 'container') {
  const children = node.children.filter((child) => child.type === 'element');
  const properties = {};
  const { componentModels } = ctx;
  const fields = createComponentGroups(findFieldsById(componentModels, id));
  if (!fields) {
    return properties;
  }
  const mainFields = getMainFields(fields);
  mainFields.forEach((field, idx) => {
    if (children.length <= idx) {
      return;
    }
    if (field.component === 'group') {
      const groupFields = getMainFields(field.fields);
      const containerNode = select('div > div', children[idx]);
      const containerChildren = containerNode.children.filter((child) => child.type === 'element');
      let groupFieldIdx = 0;
      containerChildren.forEach((containerChild) => {
        const handler = getHandler(containerChild, [node], ctx);
        if (handler) {
          const {
            gIdx,
            groupField,
          } = findFieldByType(handler, groupFields, field.fields, groupFieldIdx);
          if (groupField) {
            let value = '';
            if (handler.name === 'button') {
              value = select('a', containerChild)?.properties?.href;
            } else if (handler.name === 'image') {
              value = select('img', containerChild)?.properties?.src;
              containerChild = select('img', containerChild);
            } else {
              value = groupField.component === 'richtext' ? encodeHtml(toHtml(containerChild).trim()) : toString(containerChild).trim();
            }
            if (properties[groupField.name]) {
              properties[groupField.name] = `${properties[groupField.name]}${value}`;
            } else {
              properties[groupField.name] = value;
            }
            collapseField(groupField.name, field.fields, properties, containerChild, handler);
          }
          groupFieldIdx = gIdx;
        }
      });
    } else if (field.name === 'classes') {
      const classNames = node?.properties?.className;
      if (classNames?.length > 1) {
        properties[field.name] = `[${classNames.slice(1).join(', ')}]`;
      }
    } else if (field?.component === 'richtext') {
      const selector = mode === 'container' ? 'div > *' : 'div > div > * ';
      properties[field.name] = encodeHtml(toHtml(selectAll(selector, children[idx])).trim());
    } else if (field?.component === 'image' || field?.component === 'reference') {
      const imageNode = select('img', children[idx]);
      if (imageNode) {
        properties[field.name] = select('img', children[idx])?.properties?.src;
        collapseField(field.name, fields, properties, imageNode);
      } else if (button.use(select('p', children[idx]))) {
        properties[field.name] = select('a', children[idx])?.properties?.href;
        collapseField(field.name, fields, properties, select('p', children[idx]));
      }
    } else {
      const headlineNode = select('h1, h2, h3, h4, h5, h6', children[idx]);
      if (headlineNode) {
        properties[field.name] = toString(select(headlineNode.tagName, children[idx])).trim();
        collapseField(field.name, fields, properties, headlineNode);
      } else {
        let value = encodeHTMLEntities(toString(select('div', children[idx])).trim());
        if (field.component === 'multiselect') {
          value = `[${value.split(',').map((v) => v.trim()).join(', ')}]`;
        }
        properties[field.name] = value;
      }
    }
  });
  properties.model = id;
  return properties;
}

function getBlockItems(node, filter, ctx) {
  if (!filter) {
    return undefined;
  }
  const elements = [];
  const { pathMap, path, componentDefinition } = ctx;
  const { name } = findNameFilterById(componentDefinition, filter);
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  for (let i = 0; i < rows.length; i += 1) {
    const itemPath = `${path}/item${i + 1}`;
    pathMap.set(rows[i], itemPath);
    const properties = extractProperties(rows[i], filter, ctx);
    elements.push({
      type: 'element',
      name: i > 0 ? `item_${i - 1}` : 'item',
      attributes: {
        'jcr:primaryType': 'nt:unstructured',
        name,
        ...properties,
      },
    });
  }
  return elements;
}

function generateProperties(node, ctx) {
  /* eslint-disable no-console */
  const nameClass = node?.properties?.className[0] || undefined;
  if (!nameClass) {
    console.warn('Block component not found');
    return {};
  }
  const { componentModels, componentDefinition, filters } = ctx;
  if (!componentModels || !componentDefinition || !filters) {
    console.warn('Block component not found');
    return {};
  }
  const { name, model, filterId } = findNameFilterById(componentDefinition, nameClass);
  const filter = findFilterById(filters, filterId);
  const attributes = extractProperties(node, model, ctx, 'simple');
  const blockItems = getBlockItems(node, filter, ctx);
  const properties = {
    name,
    filter,
    ...attributes,
  };

  return { properties, children: blockItems };
}

function getAttributes(node, ctx) {
  const { properties, children } = generateProperties(node, ctx);
  return {
    rt: 'core/franklin/components/block/v1/block',
    children,
    ...properties,
  };
}

function use(node, parents) {
  return node.tagName === 'div'
    && parents.length > 2
    && parents[parents.length - 2].tagName === 'main'
    && node.properties?.className?.length > 0
    && node.properties?.className[0] !== 'columns'
    && node.properties?.className[0] !== 'section-metadata';
}

const block = {
  use,
  getAttributes,
};

export default block;
