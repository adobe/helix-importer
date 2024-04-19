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
const skeleton = {
  declaration: {
    attributes: {
      version: '1.0',
      encoding: 'UTF-8',
    },
  },
  elements: [
    {
      type: 'element',
      name: 'jcr:root',
      attributes: {
        'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
        'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
        'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
        'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
        'jcr:primaryType': 'cq:Page',
      },
      elements: [
        {
          type: 'element',
          name: 'jcr:content',
          attributes: {
            'cq:template': '/libs/core/franklin/templates/page',
            'jcr:primaryType': 'cq:PageContent',
            'jcr:title': 'Sites Franklin Example',
            'sling:resourceType': 'core/franklin/components/page/v1/page',
          },
          elements: [
            {
              type: 'element',
              name: 'root',
              attributes: {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': 'core/franklin/components/root/v1/root',
              },
            },
          ],
        },
      ],
    },
  ],
};

export default skeleton;
