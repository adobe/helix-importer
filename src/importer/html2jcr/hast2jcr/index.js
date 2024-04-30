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
import { visitParents } from 'unist-util-visit-parents';
import convert from 'xml-js';
import skeleton from './skeleton.js';
import {
  createComponentTree, getHandler, findMatchingPath, insertComponent,
  reduceModelContainer,
} from './utils.js';
import handlers from './handlers/index.js';

function buildPath(parents, { pathMap, handler }) {
  const path = handler.name === 'metadata' ? '/jcr:root' : '/jcr:root/jcr:content/root';
  if (handler.name !== 'section' && handler.name !== 'metadata') {
    for (let i = parents.length - 1; i >= 0; i -= 1) {
      const currentNode = parents[i];
      if (pathMap.has(currentNode)) {
        for (let j = currentNode.children.length - 1; j >= 0; j -= 1) {
          const childNode = currentNode.children[j];
          if (childNode.tagName === 'hr' && pathMap.has(childNode)) {
            return pathMap.get(childNode);
          }
        }
        return pathMap.get(currentNode);
      }
    }
  }
  return path;
}

function getNodeName(name, path, { componentTree }) {
  if (name === 'metadata') {
    return 'jcr:content';
  }
  const index = componentTree(`${path}/${name}`);
  return (index === 0) ? name : `${name}_${index - 1}`;
}
export default async function hast2jcr(hast, opts = {}) {
  if (opts.componentModels) {
    // eslint-disable-next-line no-param-reassign
    opts.componentModels = reduceModelContainer(opts.componentModels);
  }
  const json = JSON.parse(JSON.stringify(skeleton));
  const [jcrRoot] = json.elements;
  const componentTree = createComponentTree();

  const pathMap = new Map();
  const ctx = {
    handlers,
    json,
    componentTree,
    pathMap,
    ...opts,
  };

  visitParents(hast, 'element', (node, parents) => {
    const handler = getHandler(node, parents, ctx);
    if (handler) {
      const path = buildPath(parents, {
        handler,
        ...ctx,
      });
      const nodeName = getNodeName(handler.name, path, ctx);
      const { getAttributes, insert: insertFunc } = handler;
      const attributes = getAttributes(node, {
        path: `${path}/${nodeName}`,
        parents,
        ...ctx,
      });

      const parentComponent = findMatchingPath(jcrRoot, path);

      if (insertFunc) {
        insertFunc(parentComponent, nodeName, attributes, ctx);
      } else {
        insertComponent(parentComponent, nodeName, attributes);
      }
      if (handler.name === 'block') {
        return 'skip';
      }

      pathMap.set(node, `${path}/${nodeName}`);
    }
    return 'continue';
  });

  const options = {
    compact: false,
    ignoreComment: true,
    spaces: 4,
  };

  return convert.json2xml(json, options);
}
