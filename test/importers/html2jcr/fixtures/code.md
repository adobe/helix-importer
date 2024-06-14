+-------------------------------------------------------------------------+
| Code                                                                    |
+=========================================================================+
| ```                                                                     |
| {                                                                       |
|   "type": "pwa-node",                                                   |
|   "name": "Action:csvimportmagento-0.0.1/push-product",                 |
|   "request": "launch",                                                  |
|   "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/wskdebug", |
|   "envFile": "${workspaceFolder}/dist/.env.local",                      |
|   "timeout": 30000,                                                     |
|   "killBehavior": "polite",                                             |
|   "localRoot": "${workspaceFolder}",                                    |
|   "remoteRoot": "/code",                                                |
|   "outputCapture": "std",                                               |
|   "attachSimplePort": 0,                                                |
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