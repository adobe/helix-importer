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
export function encodeHTMLEntities(str) {
  if (!str) {
    return '';
  }
  return str.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function matchStructure(node, template) {
  if (node.tagName !== template.tagName) {
    return false;
  }
  const childElements = node.children.filter((child) => child.type === 'element');
  if (childElements.length !== template.children.length) {
    return false;
  }
  if (childElements === 0) {
    return true;
  }
  return childElements.every((child, index) => matchStructure(child, template.children[index]));
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function findMatchingPath(obj, path) {
  if (path === '/jcr:root') {
    return obj;
  }
  const keys = path.split('/');

  const isMatchingPath = (currentKeys, targetKeys) => currentKeys.length === targetKeys.length
    && currentKeys.every((key, index) => key === targetKeys[index]);

  const search = (parentObj, currentPath) => {
    const newPath = currentPath ? `${currentPath}/${parentObj.name}` : `/${parentObj.name}`;
    const childrenObj = parentObj.elements || [];
    let matchingChild = childrenObj.find((child) => isMatchingPath([...newPath.split('/'), child.name], keys));
    if (matchingChild) {
      return matchingChild;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const child of childrenObj) {
      matchingChild = search(child, newPath);
      if (matchingChild) {
        return matchingChild;
      }
    }
    return undefined;
  };

  return search(obj, '');
}

export function insertComponent(parent, nodeName, component) {
  const elements = parent.elements || [];
  const {
    rt, nt, children, ...rest
  } = component;

  const compNode = {
    type: 'element',
    name: nodeName,
    attributes: {
      'sling:resourceType': rt,
      'jcr:primaryType': nt || 'nt:unstructured',
      ...rest,
    },
    ...(children && children.length > 0 ? { elements: children } : {}),
  };

  // eslint-disable-next-line no-param-reassign
  parent.elements = [
    ...elements,
    compNode,
  ];
}

export function hasSingleChildElement(node) {
  return node.children.filter((child) => {
    if (child.type === 'element') {
      return true;
    }
    if (child.type === 'text') {
      // Check if this is an empty text node
      return child.value.trim().length > 0;
    }
    // True for other types of nodes (ie. raw)
    return true;
  }).length === 1;
}

export function getHandler(node, parents, ctx) {
  const { handlers } = ctx;
  // Each handler must include its own `use` function to determine
  // if it wants to process the current node.
  const [name, handler] = Object.entries(handlers)
    .find(([, entry]) => entry.use(node, parents, ctx)) || [];
  if (name) {
    return { name, ...handler };
  }
  return undefined;
}

export function createComponentTree() {
  /* eslint-disable no-param-reassign */
  const tree = {};

  return function updateTree(treePath) {
    const path = treePath.split('/');

    function updateNestedTree(obj, props) {
      const component = props[0];
      if (!obj[component]) {
        obj[component] = {};
      }

      if (props.length > 1) {
        return updateNestedTree(obj[component], props.slice(1));
      }
      obj[component].counter = hasOwnProperty(obj[component], 'counter')
        ? obj[component].counter + 1
        : 0;
      return obj[component].counter;
    }

    return updateNestedTree(tree, path);
  };
}

export function findFieldsById(componentModels, id) {
  return componentModels?.find((item) => item.id === id)?.fields || [];
}

export function reduceModelContainer(modelDefinition) {
  function flatten(field) {
    if (field.component === 'container') {
      return field.fields.flatMap(flatten);
    }
    return field;
  }

  return modelDefinition.map((item) => {
    const fields = item.fields
      .flatMap((field) => {
        if (field.component === 'tab') {
          return null;
        } else {
          return flatten(field);
        }
      })
      .filter((field) => field !== null);

    return { ...item, fields };
  });
}

export function toMetaName(text) {
  return text
    .toLowerCase()
    .replace(/[^0-9a-z:_]/gi, '-');
}

export function childNodes(node) {
  return node.children.filter((n) => n.type === 'element');
}
