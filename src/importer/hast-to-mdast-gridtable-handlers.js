/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {
  TYPE_BODY,
  TYPE_CELL,
  TYPE_FOOTER,
  TYPE_HEADER,
  TYPE_ROW,
  TYPE_TABLE,
} from '@adobe/mdast-util-gridtables';

function convert(type) {
  return (state, node) => ({ type, children: state.all(node) });
}

function table(state, node) {
  let children = state.all(node);

  // people never create <thead> or <tbody>, but only use a <th> to mark the cell (row) as header
  // which is technically wrong, since also a column can be a header. however the default sanitized
  // dom will always have a <tbody> so we need move rows that have a <th> cell into the table head.
  if (!children.find(({ type }) => type === TYPE_HEADER)) {
    const head = [];
    const body = [];

    const shove = (r) => {
      if (r.hasHeaderCell) {
        head.push(r);
      } else {
        body.push(r);
      }
      // eslint-disable-next-line no-param-reassign
      delete r.hasHeaderCell;
    };

    for (const child of children) {
      if (child.type === TYPE_ROW) {
        shove(child);
      } else {
        child.children.forEach(shove);
      }
    }
    children = [];
    if (head.length) {
      children.push({
        type: TYPE_HEADER,
        children: head,
      });
    }
    if (body.length) {
      children.push({
        type: TYPE_BODY,
        children: body,
      });
    }
  }
  return {
    type: TYPE_TABLE,
    children,
  };
}

function row(state, node) {
  return {
    type: TYPE_ROW,
    children: state.all(node),
    hasHeaderCell: node.hasHeaderCell,
  };
}

function cell(state, node, parent) {
  const ATTR_MAP = {
    align: 'align',
    valign: 'valign',
    rowspan: 'rowSpan',
    colspan: 'colSpan',
  };
  if (node.tagName === 'th') {
    // eslint-disable-next-line no-param-reassign
    parent.hasHeaderCell = true;
  }
  const props = {};
  if (node.properties) {
    for (const [key, value] of Object.entries(node.properties)) {
      const lKey = key.toLowerCase();
      if (lKey in ATTR_MAP) {
        props[ATTR_MAP[lKey]] = value;
      }
    }
  }
  return {
    type: TYPE_CELL,
    children: state.all(node),
    ...props,
  };
}

export default {
  table,
  thead: convert(TYPE_HEADER),
  tbody: convert(TYPE_BODY),
  tfoot: convert(TYPE_FOOTER),
  tr: row,
  td: cell,
  th: cell,
};
