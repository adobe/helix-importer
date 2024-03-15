/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-shadow */

import { strictEqual } from 'assert';
import { describe, it, xit } from 'mocha';

import { JSDOM } from 'jsdom';

import DOMUtils from '../../src/utils/DOMUtils.js';

describe('DOMUtils#fragment tests', () => {
  const test = (input) => {
    const { document } = (new JSDOM()).window;
    const output = DOMUtils.fragment(document, input);
    const div = document.createElement('div');
    div.append(output);
    const expected = document.createElement('div');
    expected.innerHTML = input;
    strictEqual(div.outerHTML, expected.outerHTML);
  };

  it('can create fragments from string', () => {
    test('some text');
    test(' some text with spaces ');
    test('<a href="linkhref">linkcontent</a>');
    test('<p><em>Caption Text</em></p>');
    test('some text: <a href="linkhref">linkcontent</a> <a href="linkhref">another link</a>');
  });
});

describe('DOMUtils#reviewInlineElement tests', () => {
  const test = (input, tag, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewInlineElement(document, tag);
    strictEqual(document.body.innerHTML, expected);
  };

  it('reviewInlineElement does not change the DOM', () => {
    test('<a href="linkhref">linkcontent</a>', 'a', '<a href="linkhref">linkcontent</a>');
    test('<a href="linkhref">linkcontent</a><a href="linkhref2">linkcontent2</a>', 'a', '<a href="linkhref">linkcontent</a><a href="linkhref2">linkcontent2</a>');
  });

  it('reviewInlineElement merges nodes', () => {
    test('<a href="linkhref">linkcontent</a><a href="linkhref">linkcontent2</a>', 'a', '<a href="linkhref">linkcontentlinkcontent2</a>');
    test('<span>text</span><span> and more text</span>', 'span', '<span>text and more text</span>');
    test('<em>text</em><em> and more text</em>', 'em', '<em>text and more text</em>');
    test('<em> text</em><em> and more text</em>', 'em', '<span> </span><em>text and more text</em>');
    test('<em> text </em><em>and more text </em>', 'em', '<span> </span><em>text and more text</em><span> </span>');
  });

  it('reviewInlineElement filters out useless punctuation tags', () => {
    test('<a href="linkhref">linkcontent<strong>:</strong></a>', 'strong', '<a href="linkhref">linkcontent:</a>');
    test('<a href="linkhref">linkcontent<span>: </span></a>', 'span', '<a href="linkhref">linkcontent: </a>');
    test('<a href="linkhref">linkcontent</a><em>.</em>', 'em', '<a href="linkhref">linkcontent</a>.');
    test('<a href="linkhref">linkcontent</a><i>. </i>', 'i', '<a href="linkhref">linkcontent</a>. ');
  });

  it('reviewInlineElement cleans up &nbsp;', () => {
    test('<p><strong>So</strong><strong>me</strong><strong> - </strong><strong>complicated&nbsp;</strong><strong>setup&nbsp;</strong><strong>found&nbsp;</strong><strong>on&nbsp;</strong><strong>real site.</strong></p>', 'strong', '<p><strong>Some - complicated setup found on real site.</strong></p>');
  });

  it('reviewInlineElement nested tags', () => {
    const intermediate = '<p><strong><em>emphasis</em><em> space </em><em>another emphasis</em> <em>last emphasis</em></strong></p>';
    test('<p><strong><em>emphasis</em></strong><strong><em> space </em></strong><strong><em>another emphasis</em></strong> <strong><em>last emphasis</em></strong></p>', 'strong', intermediate);
    test(intermediate, 'em', '<p><strong><em>emphasis space another emphasis last emphasis</em></strong></p>');
  });

  it('reviewInlineElement removes empty tags', () => {
    test('<p><strong></strong><strong>only strong</strong></p>', 'strong', '<p><strong>only strong</strong></p>');
    test('<p><strong><em></em></strong><strong><em>only strong</em></strong></p>', 'strong', '<p><strong><em>only strong</em></strong></p>');
  });

  it('reviewInlineElement does not remove useful tags', () => {
    test('<p><a href="animage.jpg"><img src="animage.jpg"></a></p>', 'a', '<p><a href="animage.jpg"><img src="animage.jpg"></a></p>');
  });

  it('reviewInlineElement digests spaces', () => {
    test('<p><strong>Sentence</strong> <strong>must</strong> <strong>be</strong> <strong>strong!</strong></p>', 'strong', '<p><strong>Sentence must be strong!</strong></p>');
  });

  it('reviewInlineElement extract trailing spaces', () => {
    test('<div><ul><li>The <strong>ideal image size </strong>for your Facebook cover photo is <strong>851px by 315px.</strong></li><li>For <u><a href="https://www.facebook.com/help/266520536764594?helpref=uf_permalink">best results</a></u>, make sure your image is <strong>JPG format</strong>, with RGB color, and <strong>less than 100 KB.</strong></li><li>Facebook will automatically format your photo to fit the cover photo slot, so if it’s not sized correctly, you might experience some distortion. If you can’t meet the recommended sizing, <strong>make sure your image is at least 400px by 150px.</strong></li><li>Cover photos are displayed at <strong>820px by 312px </strong>on desktop and at <strong>640px by 360px</strong> on a smartphone so stick to a design that works at both sizes.</li></ul><p></p></div>', 'strong', '<div><ul><li>The <strong>ideal image size</strong><span> </span>for your Facebook cover photo is <strong>851px by 315px.</strong></li><li>For <u><a href="https://www.facebook.com/help/266520536764594?helpref=uf_permalink">best results</a></u>, make sure your image is <strong>JPG format</strong>, with RGB color, and <strong>less than 100 KB.</strong></li><li>Facebook will automatically format your photo to fit the cover photo slot, so if it’s not sized correctly, you might experience some distortion. If you can’t meet the recommended sizing, <strong>make sure your image is at least 400px by 150px.</strong></li><li>Cover photos are displayed at <strong>820px by 312px</strong><span> </span>on desktop and at <strong>640px by 360px</strong> on a smartphone so stick to a design that works at both sizes.</li></ul><p></p></div>');
  });
});

describe('DOMUtils#reviewParagraphs tests', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewParagraphs(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('reviewParagraphs remove useless paragraphs', () => {
    test('<p><strong><em>&nbsp;</em></strong></p><p>usefull</p>', '<p>usefull</p>');
    test('<p><em>&nbsp;</em></p><p>usefull</p>', '<p>usefull</p>');
    test('<p>usefull</p><p>&nbsp;</p>', '<p>usefull</p>');
    test('<p>usefull</p><p>&nbsp;</p><p>usefull too</p>', '<p>usefull</p><p>usefull too</p>');
  });

  it('reviewParagraphs does not remove usefull paragraphs', () => {
    test('<p><img src="animage.jpg"></p>', '<p><img src="animage.jpg"></p>');
    test('<p><a href="animage.jpg"><img src="animage.jpg"></a></p>', '<p><a href="animage.jpg"><img src="animage.jpg"></a></p>');
    test('<p><div></div></p>', '<div></div>');
    test('<p><video width="320" height="240" controls=""><source src="movie.mp4" type="video/mp4"></video></p>', '<p><video width="320" height="240" controls=""><source src="movie.mp4" type="video/mp4"></video></p>');
    test('<p><iframe src="www.iframe.com"></iframe></p>', '<p><iframe src="www.iframe.com"></iframe></p>');
  });

  it('reviewParagraphs replaces &nbsp; with spaces', () => {
    test('<p>usefull with space&nbsp;</p>', '<p>usefull with space </p>');
    test('<p>&nbsp;more&nbsp;spaces&nbsp;<br> &nbsp;</p>', '<p> more spaces <br>  </p>');
  });
});

describe('DOMUtils#reviewHeadings tests', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewHeadings(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('reviewHeadings filters headings', () => {
    test('<h1><strong>Super title</strong></h1>', '<h1>Super title</h1>');
  });

  it('reviewHeadings filters headings but keep the ones clean', () => {
    test('<h1><strong>Super title</strong></h1><h2><strong>Another title</strong></h2><h3>Do not touch this title</h3>', '<h1>Super title</h1><h2>Another title</h2><h3>Do not touch this title</h3>');
  });

  it('reviewHeadings filters headings but do not change other elements', () => {
    test('<h1><strong>Super title</strong></h1><p><strong>String text</strong></p>', '<h1>Super title</h1><p><strong>String text</strong></p>');
  });

  it('reviewHeadings filters all headings', () => {
    test('<h1><strong>H1</strong></h1><h2><strong>H2</strong></h2><h3><strong>H3</strong></h3><h4><strong>H4</strong></h4><h5><strong>H5</strong></h5><h6><strong>H6</strong></h6>', '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>');
  });

  it('reviewHeadings removes empty headings', () => {
    test('<h1><strong>H1</strong></h1><h2><strong></strong></h2><h3><strong>H3</strong></h3><h4></h4><h5><strong>H5</strong></h5><h6></h6>', '<h1>H1</h1><h3>H3</h3><h5>H5</h5>');
  });
});

describe('DOMUtils#remove tests', () => {
  const test = (input, selectors, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.remove(document, selectors);
    strictEqual(document.body.innerHTML, expected);
  };

  it('remove elements', () => {
    test('<a>link</a>', ['a'], '');
    test('<a>link</a><a>link2</a>', ['a'], '');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['a'], '<p>paragraph</p>');
    test('<a>link</a><p>paragraph</p><a>link2</a>', ['p'], '<a>link</a><a>link2</a>');
    test('<a class="badlink">link</a><p>paragraph</p><a>link2</a>', ['.badlink'], '<p>paragraph</p><a>link2</a>');
  });
});

describe('DOMUtils#removeCommments tests', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.removeComments(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('remove comments', () => {
    // do nothing
    test('<p></p>', '<p></p>');

    // remove comments
    test('<p><!-- useless comment --></p>', '<p></p>');
    test('<p><!-- useless comment \n multiline --></p>', '<p></p>');
    test('<p><!-- useless comment \n multiline \n multiline --></p>', '<p></p>');
    test('<!-- useless comment --><p>The content stays</p><!-- another useless comment with \n line break -->', '<p>The content stays</p>');
    test('<p>The content stays<!-- useless comment inside an element --></p>', '<p>The content stays</p>');
    test('<p>The content and spaces stay</p>  <!-- a useless comment preceded by spaces -->', '<p>The content and spaces stay</p>  ');
    test('<p>This is a paragraph.</p>\n\x3C!--\n<p>Look at this cool image:</p>\n<img border="0" src="pic_trulli.jpg" alt="Trulli">\n-->\n<p>This is a paragraph too.</p>\x3C!-- same line -->\n\x3C!-- single line -->', '<p>This is a paragraph.</p>\n\n<p>This is a paragraph too.</p>\n');
    test('<div some-crazy-attribute="" <!--=""><!-- useless comment --></div>', '<div some-crazy-attribute="" <!--=""></div>');
  });
});

describe('DOMUtils#removeSpans tests', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.removeSpans(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('remove spans', () => {
    // do nothing
    test('<p></p>', '<p></p>');

    // remove spans
    test('<p><span></span></p>', '<p></p>');
    test('<p><span>Content should remain</span> the same</p>', '<p>Content should remain the same</p>');
    test('<p>Spacing<span> should</span> remain the same</p>', '<p>Spacing should remain the same</p>');
    test('<p>Spacing<span> should</span> remain the <span>same even</span> with<span> multiple spans</span></p>', '<p>Spacing should remain the same even with multiple spans</p>');
    test('<span><div><img src="animage.jpg"></div></span>', '<span><div><img src="animage.jpg"></div></span>');
    test('<span>Some image here: <div><img src="animage.jpg"></div></span>', '<span>Some image here: <div><img src="animage.jpg"></div></span>');
    test('<div>Spans potentially used to do layouting: <span class="tab1">tab1</span><span class="tab2">tab2</span></div>', '<div>Spans potentially used to do layouting: <span class="tab1">tab1</span><span class="tab2">tab2</span></div>');
    test('<div>Spans potentially used to do layouting: <span id="tab1">tab1</span><span id="tab2">tab2</span></div>', '<div>Spans potentially used to do layouting: <span id="tab1">tab1</span><span id="tab2">tab2</span></div>');
  });
  it('keeps styled spans', () => {
    test('<p><span style="text-decoration: underline;">This should be underlined.</span></p>', '<p><span style="text-decoration: underline;">This should be underlined.</span></p>');
  });
});

describe('DOMUtils#removeNoscripts tests', () => {
  const test = (input, expected) => {
    strictEqual(DOMUtils.removeNoscripts(input), expected);
  };

  it('remove no scripts', () => {
    // do nothing
    test('<p>Some content</p>', '<p>Some content</p>');

    // remove noscript
    test('<body>Do A<noscript>Do Z</noscript></body>', '<body>Do A</body>');
    test('<body>Do A<noscript>Do Z</noscript> but also do B<noscript>and X</noscript></body>', '<body>Do A but also do B</body>');
    test('<body>Do A<noscript>Do Z\n Do X</noscript> but also do B<noscript>and W \n and Y</noscript></body>', '<body>Do A but also do B</body>');
  });
});

describe('DOMUtils#replaceByCaptions tests', () => {
  const test = (input, selectors, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.replaceByCaptions(document, selectors);
    strictEqual(document.body.innerHTML, expected);
  };

  it('replace by captions', () => {
    // do nothing
    test('<p>Some content</p>', ['i'], '<p>Some content</p>');

    test('<p>Some content</p><img src="image.png"><figcaption>Copyright to author.</figcaption><p>Some more content</p>', ['figcaption'], '<p>Some content</p><img src="image.png"><p><em>Copyright to author.</em></p><p>Some more content</p>');
    test('<p>Some content</p><img src="image.png"><figcaption>Copyright to author.</figcaption><div class="custom-caption">Another copyright to author.</div><p>Some more content</p>', ['figcaption', '.custom-caption'], '<p>Some content</p><img src="image.png"><p><em>Copyright to author.</em></p><p><em>Another copyright to author.</em></p><p>Some more content</p>');
  });
});

describe('DOMUtils#replaceEmbeds', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.replaceEmbeds(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('replace embeds', () => {
    // do nothing
    test('<p>Some content</p>', '<p>Some content</p>');
  });

  it('replace embeds deals with iframes', () => {
    test('<p>Some content</p><iframe src="https://www.youtube.com/xyz"></iframe>', '<p>Some content</p><table><tbody><tr><th>Embed</th></tr><tr><td><a href="https://www.youtube.com/xyz">https://www.youtube.com/xyz</a></td></tr></tbody></table>');
    test('<p>Some content</p><iframe data-src="https://www.youtube.com/xyz"></iframe>', '<p>Some content</p><table><tbody><tr><th>Embed</th></tr><tr><td><a href="https://www.youtube.com/xyz">https://www.youtube.com/xyz</a></td></tr></tbody></table>');
    test('<p>Some content</p><iframe data-src="https://www.youtube.com/data-src" src="https://www.youtube.com/src"></iframe>', '<p>Some content</p><table><tbody><tr><th>Embed</th></tr><tr><td><a href="https://www.youtube.com/data-src">https://www.youtube.com/data-src</a></td></tr></tbody></table>');
  });

  it('replace embeds deals video tag / content blocks', () => {
    // Video block
    test('<p>Some content</p><video src="https://www.server.com/video.mp4"></video>', '<p>Some content</p><table><tbody><tr><th>Video</th></tr><tr><td><video src="https://www.server.com/video.mp4"></video></td></tr></tbody></table>');

    // Animation block
    test('<p>Some content</p><video src="https://www.server.com/video.mp4" autoplay="true"></video>', '<p>Some content</p><table><tbody><tr><th>Animation</th></tr><tr><td><video src="https://www.server.com/video.mp4" autoplay="true"></video></td></tr></tbody></table>');
  });
});

describe('DOMUtils#encodeImagesForTable', () => {
  const test = (input, expected) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.encodeImagesForTable(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('encode images for table', () => {
    // do nothing
    test('<p>Some content</p>', '<p>Some content</p>');

    // encode pipe if image is in table
    test('<p>Some content</p><table><tr><td><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe"></td></tr></table>', '<p>Some content</p><table><tbody><tr><td><img src="https://www.server.com/image.jpg" title="Some title \\| which contains a pipe"></td></tr></tbody></table>');

    // don't encode pipe if image is not in a table
    test('<p>Some content</p><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe">', '<p>Some content</p><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe">');
  });
});

describe('DOM#createTable tests', () => {
  const test = (data, expected) => {
    const { document } = (new JSDOM()).window;
    const table = DOMUtils.createTable(data, document);
    strictEqual(table.outerHTML, expected);
  };

  it('createTable - basic tables', () => {
    test(
      [[]],
      '<table><tr></tr></table>',
    );
    test(
      [['header']],
      '<table><tr><th>header</th></tr></table>',
    );
    test(
      [['header'], ['cell']],
      '<table><tr><th>header</th></tr><tr><td>cell</td></tr></table>',
    );
    test(
      [['header1', 'header2'], ['cell11', 'cell12'], ['cell21', 'cell22']],
      '<table><tr><th>header1</th><th>header2</th></tr><tr><td>cell11</td><td>cell12</td></tr><tr><td>cell21</td><td>cell22</td></tr></table>',
    );
  });

  it('createTable - handles colspans', () => {
    test(
      [['header1'], ['cell11', 'cell12'], ['cell21', 'cell22']],
      '<table><tr><th colspan="2">header1</th></tr><tr><td>cell11</td><td>cell12</td></tr><tr><td>cell21</td><td>cell22</td></tr></table>',
    );

    test(
      [['header1'], ['cell11', 'cell12', 'cell13', 'cell14']],
      '<table><tr><th colspan="4">header1</th></tr><tr><td>cell11</td><td>cell12</td><td>cell13</td><td>cell14</td></tr></table>',
    );

    test(
      [['header1', 'header2'], ['cell11', 'cell12', 'cell13', 'cell14']],
      '<table><tr><th>header1</th><th colspan="3">header2</th></tr><tr><td>cell11</td><td>cell12</td><td>cell13</td><td>cell14</td></tr></table>',
    );

    // messy table
    test(
      [['header1', 'header2'], ['cell11', 'cell12', 'cell13', 'cell14'], ['cell22'], ['cell31', 'cell32', 'cell33']],
      '<table><tr><th>header1</th><th colspan="3">header2</th></tr><tr><td>cell11</td><td>cell12</td><td>cell13</td><td>cell14</td></tr><tr><td colspan="4">cell22</td></tr><tr><td>cell31</td><td>cell32</td><td colspan="2">cell33</td></tr></table>',
    );
  });

  it('createTable - deals with Elements', () => {
    const { document } = (new JSDOM()).window;

    const img = document.createElement('img');
    img.src = 'https://www.sample.com/image.jpeg';

    const a = document.createElement('a');
    a.href = 'https://www.sample.com/';

    test(
      [['header'], [img]],
      '<table><tr><th>header</th></tr><tr><td><img src="https://www.sample.com/image.jpeg"></td></tr></table>',
    );
    test(
      [['header1', 'header2', 'header3'], [img, a, 'some text']],
      '<table><tr><th>header1</th><th>header2</th><th>header3</th></tr><tr><td><img src="https://www.sample.com/image.jpeg"></td><td><a href="https://www.sample.com/"></a></td><td>some text</td></tr></table>',
    );
    test(
      [['header'], [[img, a, 'some text']]],
      '<table><tr><th>header</th></tr><tr><td><img src="https://www.sample.com/image.jpeg"><a href="https://www.sample.com/"></a>some text</td></tr></table>',
    );
  });
});

const createElement = (tag, attrs, styles, innerHTML) => {
  const { document } = (new JSDOM()).window;
  const element = document.createElement(tag);
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const a in attrs) {
    element.setAttribute(a, attrs[a]);
  }
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const p in styles) {
    element.style[p] = styles[p];
  }
  element.innerHTML = innerHTML;
  return element;
};

describe('DOMUtils#replaceBackgroundByImg', () => {
  const test = (element, expected) => {
    const { document } = (new JSDOM()).window;
    const ret = DOMUtils.replaceBackgroundByImg(element, document);
    strictEqual(ret.outerHTML, expected);
  };

  it('no background-image style', () => {
    test(createElement('p', {}, {}, 'Some content'), '<p>Some content</p>');

    test(createElement('img', { src: 'https://www.server.com/image.jpg', title: 'Some title' }, {}, ''), '<img src="https://www.server.com/image.jpg" title="Some title">');

    test(createElement('p', {}, { 'background-image': 'none' }, 'Some content'), '<p style="background-image: none;">Some content</p>');
  });

  it('with background-image style', () => {
    test(createElement('p', {}, { 'background-image': 'url(https://www.server.com/image.jpg)' }, 'Some content'), '<img src="https://www.server.com/image.jpg">');
    test(createElement('p', { class: 'class-is-lost' }, { 'background-image': 'url("https://www.server.com/image.jpg")' }, 'Some content'), '<img src="https://www.server.com/image.jpg">');
    test(createElement('div', { class: 'class-is-lost' }, { 'background-image': 'url("https://www.server.com/image.jpg")' }, '<div><div>Some divs</div><div>More divs</div></div>'), '<img src="https://www.server.com/image.jpg">');
  });
});

describe('DOMUtils#getImgFromBackground', () => {
  const test = (element, expected) => {
    const { document } = (new JSDOM()).window;
    const ret = DOMUtils.getImgFromBackground(element, document);
    strictEqual(ret ? ret.outerHTML : null, expected);
  };

  it('no background-image style', () => {
    test(createElement('p', {}, {}, 'Some content'), null);
    test(createElement('img', { src: 'https://www.server.com/image.jpg', title: 'Some title' }, {}, ''), null);
    test(createElement('p', {}, { 'background-image': 'none' }, 'Some content'), null);
  });

  it('with background-image style', () => {
    test(createElement('p', {}, { 'background-image': 'url(https://www.server.com/image.jpg)' }, 'Some content'), '<img src="https://www.server.com/image.jpg">');
    test(createElement('p', {}, { 'background-image': 'url("https://www.server.com/image.jpg")' }, 'Some content'), '<img src="https://www.server.com/image.jpg">');
    test(createElement('p', {}, { 'background-image': 'url(\'https://www.server.com/image.jpg\')' }, 'Some content'), '<img src="https://www.server.com/image.jpg">');
    test(createElement('p', {}, { 'background-image': 'url(http://localhost:3001/image.jpg)' }, 'Some content'), '<img src="http://localhost:3001/image.jpg">');
  });

  // `createElement` uses JSDOM to create the test-DOM
  // the workaround in DOMUtils#getImgFromBackground exists _precisely_
  // because of a potential bug in JSDOM due to which it doesn't
  // parse `url()` with whitespaces correctly
  // disabling the test, keeping it as a reference
  xit('with background-image style containing whitespace in url()', () => {
    test(createElement('p', {}, { 'background-image': 'url( /image.jpg )' }, 'Some content'), '<img src="/image.jpg">');
  });
});

describe('DOMUtils#getDataUrlFromB64Img', () => {
  const test = (img, expected) => {
    const dataUrl = DOMUtils.getDataUrlFromB64Img(img.src);
    return expected(dataUrl) === true;
  };

  it('no data url in original image', () => {
    test(createElement('img', { src: 'https://www.server.com/image.jpg' }, {}, ''), (res) => res === null);
  });

  it('malformed base64 data url in original image', () => {
    test(createElement('img', { src: 'data:image/png;base64,--dummy--' }, {}, ''), (res) => res === null);
  });

  it('base64 data url in original image', () => {
    test(createElement('img', { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==' }, {}, ''), (res) => res.indexOf('blob:nodedata:') === 0);
  });
});
