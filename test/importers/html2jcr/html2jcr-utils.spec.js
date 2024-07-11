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
import { h } from 'hastscript';
import assert from 'assert';
import { describe, it } from 'mocha';
import {
  insertComponent, createComponentTree, matchStructure, findMatchingPath, reduceModelContainer,
} from '../../../src/importer/html2jcr/hast2jcr/utils.js';

describe('Utils', () => {
  it('Insert component at a path', async () => {
    const obj = {
      type: 'element',
      name: 'root',
      elements: [
        {
          type: 'element',
          name: 'jcr:content',
          attributes: {
            'jcr:primaryType': 'nt:unstructured',
          },
          elements: [
            {
              type: 'element',
              name: 'text',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': 'text',
              },
            },
          ],
        },
      ],
    };
    const path = '/root/jcr:content';
    const nodeName = 'image';
    const component = {
      rt: '/apps/image',
    };
    const parentComponent = findMatchingPath(obj, path);
    insertComponent(parentComponent, nodeName, component);
    const expected = {
      type: 'element',
      name: 'root',
      elements: [
        {
          type: 'element',
          name: 'jcr:content',
          attributes: {
            'jcr:primaryType': 'nt:unstructured',
          },
          elements: [
            {
              type: 'element',
              name: 'text',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': 'text',
              },
            },
            {
              type: 'element',
              name: 'image',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': '/apps/image',
              },
            },
          ],
        },
      ],
    };
    assert.deepStrictEqual(obj, expected);
  });

  it('test create tree', async () => {
    const tree = createComponentTree();
    assert.deepStrictEqual(tree('a/b/c'), 0);
    assert.deepStrictEqual(tree('a/b/c'), 1);
  });

  it('match structure', async () => {
    assert.equal(
      matchStructure(h('p', [h('a')]), h('p', [h('a')])),
      true,
    );
  });

  it('reduce container model definition', async () => {
    const modelDefinition = [
      {
        id: 'page-metadata',
        fields: [
          {
            component: 'tab',
            name: 'common',
            label: 'Commons',
          },
          {
            component: 'richtext',
            name: 'abstract',
            label: 'Absrtact',
            description: 'Enter an abstract for site search',
          },
          {
            component: 'container',
            label: 'Fieldset',
            fields: [
              {
                component: 'container',
                label: 'Nested Fieldset',
                fields: [
                  {
                    component: 'text',
                    name: 'theme',
                    label: 'Theme',
                    required: true,
                  },
                  {
                    component: 'aem-content',
                    name: 'author',
                    label: 'Author',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const modelDefinitionExpected = [
      {
        id: 'page-metadata',
        fields: [
          {
            component: 'richtext',
            name: 'abstract',
            label: 'Absrtact',
            description: 'Enter an abstract for site search',
          },
          {
            component: 'text',
            name: 'theme',
            label: 'Theme',
            required: true,
          },
          {
            component: 'aem-content',
            name: 'author',
            label: 'Author',
          },
        ],
      },
    ];
    const result = reduceModelContainer(modelDefinition);
    assert.deepStrictEqual(result, modelDefinitionExpected);
  });
});
