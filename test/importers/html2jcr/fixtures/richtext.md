+-------------------------------------------------------------------------+
| richtext                                                                |
+=========================================================================+
| Text with link [CTA 1](htttps://www.adobe.com) becomes richtext as well |
| Text with link [CTA 2](htttps://www.google.com)  as well                |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| richtext                                                                |
+=========================================================================+
| [CTA 1](htttps://www.adobe.com) becomes richtext as well                |
| [CTA 2](htttps://www.google.com)  as well                               |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| richtext                                                                |
+=========================================================================+
| Just plain text becomes richtext as well                                |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| richtext                                                                |
+=========================================================================+
| ```                                                                     |
| {                                                                       |
|   "type": "pwa-node",                                                   |
|   "name": "Action:csvimportmagento-0.0.1/push-product",                 |
|   "runtimeArgs": [                                                      |
|     "csvimportmagento-0.0.1/push-product",                              |
|     "${workspaceFolder}/actions/push-product/index.js",                 |
|     "-v",                                                               |
|     "—disable-concurrency",                                             |
|     "—kind",                                                            |
|     "nodejs:12"                                                         |
|   ]                                                                     |
| },                                                                      |
| ...                                                                     |
|  "compounds": [                                                         |
|      {                                                                  |
|        "name": "Actions",                                               |
|        "configurations": [                                              |
|          ......                                                         |
|          "Action:csvimportmagento-0.0.1/push-product"                   |
|        ]                                                                |
|      },                                                                 |
|      {                                                                  |
|        "name": "WebAndActions",                                         |
|        "configurations": [                                              |
|          ......                                                         |
|          "Action:csvimportmagento-0.0.1/push-product"                   |
|        ]                                                                |
|      }                                                                  |
|    ]                                                                    |
| ```                                                                     |
+-------------------------------------------------------------------------+
