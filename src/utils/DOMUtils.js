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

export default class DOMUtils {
  static EMPTY_TAGS_TO_PRESERVE = ['img', 'video', 'iframe', 'div', 'picture'];

  static fragment(document, string) {
    const tpl = document.createElement('template');
    tpl.innerHTML = string;
    return tpl.content;
  }

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
        tag.replaceWith(DOMUtils.fragment(document, tag.innerHTML));
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
          tag.after(DOMUtils.fragment(document, '<span> </span>'));
        }

        if (innerHTML.indexOf(' ') === 0) {
          // move leading space to a new text node outside of current element
          tag.innerHTML = innerHTML.slice(1);
          tag.before(DOMUtils.fragment(document, '<span> </span>'));
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
          || (tag.textContent.charCodeAt(0) === 160 && tag.textContent.length === 1))
        && !tag.querySelector(DOMUtils.EMPTY_TAGS_TO_PRESERVE.join(','))
      ) {
        tag.remove();
      } else {
        tag.innerHTML = tag.innerHTML.replace(/&nbsp;/gm, ' ');
      }
    }
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
      .replace(/(>\s*)<!--(?!>)[\S\s]*?-->/gm, '$1')
      .replace(/<!--(?!>)[\S\s]*?-->/gm, '');
  }

  static removeSpans(document) {
    // remove spans
    document.querySelectorAll('span').forEach((span) => {
      // do not touch spans with images and span with a css class or an id
      if (!span.querySelector('img') && span.classList.length === 0 && !span.id && !span.getAttribute('style')) {
        if (span.textContent === '') {
          span.remove();
        } else {
          span.replaceWith(DOMUtils.fragment(document, span.innerHTML));
        }
      }
    });
  }

  static replaceByCaptions(document, selectors) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((elem) => {
        const captionText = elem.textContent.trim();
        elem.parentNode.insertBefore(DOMUtils.fragment(document, `<p><em>${captionText}</em></p>`), elem);
        elem.remove();
      });
    });
  }

  static createTable(data, document) {
    const table = document.createElement('table');

    let maxColumns = 0;
    data.forEach((row, index) => {
      const tr = document.createElement('tr');

      maxColumns = Math.max(maxColumns, row.length);
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

    // adjust the colspans
    table.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      if (cells.length < maxColumns) {
        const lastCell = cells[cells.length - 1];
        lastCell.setAttribute('colspan', maxColumns - cells.length + 1);
      }
    });

    return table;
  }

  static generateEmbed(document, url) {
    return DOMUtils.fragment(document, `<table><tr><th>Embed</th></tr><tr><td><a href="${url}">${url}</a></td></tr></table>`);
  }

  static replaceEmbeds(document) {
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.getAttribute('src');
      const dataSrc = iframe.getAttribute('data-src');
      const url = dataSrc || src;
      if (url) {
        iframe.after(DOMUtils.generateEmbed(document, url));
      }
      iframe.remove();
    });

    document.querySelectorAll('video').forEach((video) => {
      let blockType = 'Video';
      if (video.autoplay) {
        blockType = 'Animation';
      }
      const anim = DOMUtils.fragment(document, `<table><tr><th>${blockType}</th></tr><tr><td>${video.outerHTML}</td></tr></table>`);
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
    const styleAttr = element?.getAttribute('style')?.split(';');
    if (styleAttr) {
      styleAttr.forEach((style) => {
        const split = style.split(':');
        const prop = split.shift();
        const value = split.join(':').trim();
        if (prop === 'background-image') {
          const trimmedValue = value.replace(/\s/g, '');
          const elStyle = element.style;
          elStyle.backgroundImage = trimmedValue;
        }
      });
      const url = element.style.backgroundImage;
      if (url && url.toLowerCase() !== 'none') {
        const src = url.replace(/url\(/gm, '').replace(/'/gm, '').replace(/"/gm, '').replace(/\)/gm, '');
        const img = document.createElement('img');
        img.src = src;
        return img;
      }
    }
    return null;
  }

  static async waitForElement(selector, document, timeout = 5000, interval = 250) {
    return new Promise((resolve, reject) => {
      const timeWas = new Date();
      const wait = setInterval(() => {
        if (document.querySelector(selector)) {
          clearInterval(wait);
          resolve();
        } else if (new Date() - timeWas > timeout) { // Timeout
          clearInterval(wait);
          reject();
        }
      }, interval);
    });
  }

  static getDataUrlFromB64Img(src) {
    try {
      const arr = src.split(',');
      const type = arr[0].split(':')[1];
      const b64Str = atob(arr[1]);
      const bytesArray = new Uint8Array(b64Str.length);
      for (let i = 0; i < b64Str.length; i += 1) {
        bytesArray[i] = b64Str.charCodeAt(i);
      }
      const blob = new Blob([bytesArray], { type });
      return URL.createObjectURL(blob);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`get data url from a base64 image (${src}):`, e);
      return null;
    }
  }
}
