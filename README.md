# Helix Importer

Foundation tools for importing website content into that can be consumed in an Helix project.

helix-importer is composed of 2 main building blocks:

1. explorer: crawl a website to construct a list of urls to be importer
2. importer: construct an importer - for an input url, transform the DOM and convert it into a Markdown file

The folder [./src/wp](./src/wp) contains WordPress specific utils and explorer methods.

## Explorer

Idea of an explorer is to crawl the site in order to collect a list of urls. This list of urls can then be imported.

Here is a basic sample:

```js

import { WPContentPager, FSHandler, CSV } from '@adobe/helix-importer';

async function main() {
  const pager = new WPContentPager({
    nbMaxPages: 1000,
    url: 'url to a WordPress site'
  });

  const entries = await pager.explore();

  const csv = CSV.toCSV(entries);

  const handler = new FSHandler('output', console);
  await handler.put('explorer_results.csv', csv);
}
```

In this example, the [WPContentPager](./src/wp/explorers/WPContentPager.ts) extends the [PagignExplorer](src/explorer/PagingExplorer.ts) which implements the 2 methods:
- `fetch` which defines how to fetch one page on results
- `explore` which extracts the list of urls present on that page

The final result is a list of urls that could be found on list of paged results given by the WordPress API `/page/${page_number}`.

## Importer

An importer must extends [PageImporter](src/importer/PageImporter.js) and implement the `fetch` and `process` method. The general idea is that `fetch` receives the url to import and is responsible to return the HTML. `process` receives the corresponding Document in order to filter / rearrange / reshuffle the DOM before it gets processed by the Markdown transformer. `process` computes and defines the list of [PageImporterResource](src/importer/PageImporterResource.ts) (could be more than one), each resource being transformed as a Markdown document.

Goal of the importer is to get rid of the generic DOM elements like the header / footer, the nav... and all elements that are common to all pages in order to get the unique piece(s) of content per page.

### HTML2x helpers

[HTML2x](src/importer/HTML2x.js) methods (`HTML2md` and `HTML2docx`) are convienence methods to run an import. As input, they take:
- `URL`: URL of the page to import
- `document`: the DOM element to import
- `transformerCfg`: object with the transformation "rules". Object can be either:
  - `{ transformDOM: ({ url, document, html }) => { ... return element-to-convert  }, generateDocumentPath: ({ url, document }) => { ... return path-to-target; }}` for a single mapping between one input document / one output file
  - `{ transform: ({ url, document, html }) => { ... return [{ element: first-element-to-convert, path: first-path-to-target }, ...]  }` for a mapping one input document / multiple output files (useful to generate multiple docx from a single web page)

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