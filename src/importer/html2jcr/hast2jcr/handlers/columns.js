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
const resourceType = 'core/franklin/components/columns/v1/columns';

function getRows(node, ctx) {
  const elements = [];
  const { pathMap, path } = ctx;
  const rows = node.children.filter((child) => child.type === 'element' && child.tagName === 'div');
  for (let i = 0; i < rows.length; i += 1) {
    pathMap.set(rows[i], `${path}/row${i + 1}`);
    const cols = rows[i].children.filter((child) => child.type === 'element' && child.tagName === 'div');
    const columnElements = [];
    for (let j = 0; j < cols.length; j += 1) {
      pathMap.set(cols[j], `${path}/row${i + 1}/col${j + 1}`);
      columnElements.push({
        type: 'element',
        name: `col${j + 1}`,
        attributes: {
          'jcr:primaryType': 'nt:unstructured',
        },
      });
    }
    elements.push({
      type: 'element',
      name: `row${i + 1}`,
      attributes: {
        'jcr:primaryType': 'nt:unstructured',
      },
      elements: columnElements,
    });
  }
  return elements;
}

const columns = {
  use: (node, parents) => node.tagName === 'div'
      && parents.length > 2
      && parents[parents.length - 2].tagName === 'main'
      && node.properties?.className?.length > 0
      && node.properties?.className[0] === 'columns',
  getAttributes: (node, ctx) => {
    const children = getRows(node, ctx);
    return {
      rt: resourceType,
      children,
      columns: children.length,
      rows: children[0]?.elements?.length || 0,
    };
  },
};

export default columns;
