/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { JSDOM } from 'jsdom';

export default class DOMUtils {
  static EMPTY_TAGS_TO_PRESERVE = ['img', 'video', 'iframe', 'div', 'picture'];

  static reviewInlineElement(document, tagName) {
    let tags = [...document.querySelectorAll(tagName)];
    // first pass, remove empty nodes
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.textContent === '' && !tag.querySelector(DOMUtils.EMPTY_TAGS_TO_PRESERVE.join(','))) {
        tag.remove();
      } else {
        tag.innerHTML = tag.innerHTML.replace(/&nbsp;/gm, ' ');
      }
    }

    tags = [...document.querySelectorAll(tagName)];
    // make a first pass to find <tag>x</tag> <tag>y</tag> and move the space
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.nextSibling && tag.nextSibling.textContent === ' ') {
        // next is a space, check next next
        const nextNext = tag.nextSibling.nextSibling;
        if (nextNext && nextNext.tagName && nextNext.tagName.toLowerCase() === tagName) {
          // same tag
          tag.nextSibling.remove();
          tag.innerHTML = `${tag.innerHTML} `;
        }
      }
    }

    tags = [...document.querySelectorAll(tagName)];
    // collaspe consecutive <tag>
    // and make sure element does not start ends with spaces while it is before / after some text
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      if (tag.innerHTML === '.' || tag.innerHTML === '. ' || tag.innerHTML === ':' || tag.innerHTML === ': ') {
        tag.replaceWith(JSDOM.fragment(tag.innerHTML));
      } else {
        const { innerHTML } = tag;
        if (tag.previousSibling) {
          const previous = tag.previousSibling;
          if (
            previous.tagName
            && previous.tagName.toLowerCase() === tagName
            && (!previous.href || previous.href === tag.href)
          ) {
            if (tag.hasChildNodes()) {
              [...tag.childNodes].forEach((child) => {
                previous.append(child);
              });
            } else {
              // previous sibling is an <tag>, merge current one inside the previous one
              previous.append(innerHTML);
            }
            tag.remove();
          }
        }
      }
    }

    tags = [...document.querySelectorAll(tagName)];
    // extra leading and trailing spaces into a dedicated span
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      let { innerHTML } = tag;
      if (innerHTML) {
        if (innerHTML.lastIndexOf(' ') === innerHTML.length - 1) {
          // move trailing space to a new text node outside of current element
          tag.innerHTML = innerHTML.slice(0, innerHTML.length - 1);
          ({ innerHTML } = tag);
          tag.after(JSDOM.fragment('<span> </span>'));
        }

        if (innerHTML.indexOf(' ') === 0) {
          // move leading space to a new text node outside of current element
          tag.innerHTML = innerHTML.slice(1);
          tag.before(JSDOM.fragment('<span> </span>'));
        }
      }
    }
  }

  static reviewParagraphs(document) {
    const tags = [...document.querySelectorAll('p')];
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      // remove useless paragraphs
      if (
        (tag.textContent === ''
          || tag.textContent === ' '
          || tag.textContent === '&nbsp;'
          || tag.textContent.charCodeAt(0) === 160)
        && !tag.querySelector(DOMUtils.EMPTY_TAGS_TO_PRESERVE.join(','))
      ) {
        tag.remove();
      }
    }
  }

  static escapeSpecialCharacters(document) {
    // eslint-disable-next-line no-param-reassign
    document.body.innerHTML = document.body.innerHTML.replace(/~/gm, '\\~');
  }

  static reviewHeadings(document) {
    const tags = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      // remove useless strong tags
      tag.innerHTML = tag.innerHTML.replace(/<strong>|<\\strong>/gm, '');
      if (tag.innerHTML === '') {
        tag.remove();
      }
    }
  }

  static remove(document, selectors) {
    selectors.forEach((s) => {
      document.querySelectorAll(s).forEach((n) => n.remove());
    });
  }

  static removeComments(document) {
    // eslint-disable-next-line no-param-reassign
    document.body.innerHTML = document.body.innerHTML
      // remove html comments
      .replace(/<!--(?!>)[\S\s]*?-->/gm, '');
  }

  static removeSpans(document) {
    // remove spans
    document.querySelectorAll('span').forEach((span) => {
      if (!span.querySelector('img')) {
        // do not touch spans with images
        if (span.textContent === '') {
          span.remove();
        } else {
          span.replaceWith(JSDOM.fragment(span.innerHTML));
        }
      }
    });
  }

  static replaceByCaptions(document, selectors) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((elem) => {
        const captionText = elem.textContent.trim();
        elem.parentNode.insertBefore(JSDOM.fragment(`<p><em>${captionText}</em></p>`), elem);
        elem.remove();
      });
    });
  }

  static createTable(data, document) {
    const table = document.createElement('table');

    data.forEach((row, index) => {
      const tr = document.createElement('tr');

      row.forEach((cell) => {
        const t = document.createElement(index === 0 ? 'th' : 'td');
        if (typeof cell === 'string') {
          t.innerHTML = cell;
        } else if (Array.isArray(cell)) {
          cell.forEach((c) => {
            t.append(c);
          });
        } else {
          t.append(cell);
        }
        tr.appendChild(t);
      });
      table.appendChild(tr);
    });

    return table;
  }

  static generateEmbed(url) {
    return JSDOM.fragment(`<table><tr><th>Embed</th></tr><tr><td><a href="${url}">${url}</a></td></tr></table>`);
  }

  static replaceEmbeds(document) {
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.getAttribute('src');
      const dataSrc = iframe.getAttribute('data-src');
      const url = dataSrc || src;
      if (url) {
        iframe.after(DOMUtils.generateEmbed(url));
      }
      iframe.remove();
    });

    document.querySelectorAll('video').forEach((video) => {
      let blockType = 'Video';
      if (video.autoplay) {
        blockType = 'Animation';
      }
      const anim = JSDOM.fragment(`<table><tr><th>${blockType}</th></tr><tr><td>${video.outerHTML}</td></tr></table>`);
      video.replaceWith(anim);
    });
  }

  static removeNoscripts(html) {
    return html.replace(/<noscript>((.|\n)*?)<\/noscript>/gm, '');
  }

  static encodeImagesForTable(document) {
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      if (img.closest('table')) {
        // if image is in a table
        if (img.title && img.title.indexOf('|') !== -1) {
          // pipes in title do not get encoded
          // eslint-disable-next-line no-param-reassign
          img.title = img.title.replace(/\|/gm, '\\|');
        }
      }
    });
  }

  static replaceBackgroundByImg(element, document) {
    const img = DOMUtils.getImgFromBackground(element, document);
    if (img) {
      element.replaceWith(img);
      return img;
    }
    return element;
  }

  static getImgFromBackground(element, document) {
    const url = element?.style?.['background-image'];
    if (url && url.toLowerCase() !== 'none') {
      const src = url.replace(/url\(/gm, '').replace(/'/gm, '').replace(/\)/gm, '');
      const img = document.createElement('img');
      img.src = src;
      return img;
    }
    return null;
  }
}
