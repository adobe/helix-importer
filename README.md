# Helix Importer

Foundation tools for importing website content into that can be consumed in an Helix project.

Basic concept of the importer: for an input url, transform the DOM and convert it into a Markdown / docx file.

## Importer

An importer must extends [PageImporter](src/importer/PageImporter.js) and implement the `fetch` and `process` method. The general idea is that `fetch` receives the url to import and is responsible to return the HTML. `process` receives the corresponding Document in order to filter / rearrange / reshuffle the DOM before it gets processed by the Markdown transformer. `process` computes and defines the list of [PageImporterResource](src/importer/PageImporterResource.ts) (could be more than one), each resource being transformed as a Markdown document.

Goal of the importer is to get rid of the generic DOM elements like the header / footer, the nav... and all elements that are common to all pages in order to get the unique piece(s) of content per page.

### HTML2x helpers

[HTML2x](src/importer/HTML2x.js) methods (`HTML2md` and `HTML2docx`) are convienence methods to run an import. As input, they take:
- `URL`: URL of the page to import
- `document`: the DOM element to import - a Document object or a string (see `createDocumentFromString` for the string case)
- `transformerCfg`: object with the transformation "rules". Object can be either:
  - `{ transformDOM: ({ url, document, html, params }) => { ... return element-to-convert  }, generateDocumentPath: ({ url, document, html, params }) => { ... return path-to-target; }}` for a single mapping between one input document / one output file
  - `{ transform: ({ url, document, html, params }) => { ... return [{ element: first-element-to-convert, path: first-path-to-target }, ...]  }` for a mapping one input document / multiple output files (useful to generate multiple docx from a single web page)
- `config`: object with several config properties
  - `createDocumentFromString`: this config is required if you use the methods in a non-browser context and want to pass `document` param as string. This method receives the HTML to parse as a string and must return a Document object.
  - `setBackgroundImagesFromCSS`: set to false to disable the `background-image` inlining in the DOM.

### Importer UI

The Helix Importer has a dedicated browser UI: see https://github.com/adobe/helix-importer-ui

## Installation

```shell
npm i https://github.com/adobe/helix-importer 
```

TODO: publish npm module

## Usage

```js
import { ... } from '@adobe/helix-importer';
```
