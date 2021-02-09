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

import DOMUtils from '../../src/utils/DOMUtils';

import { strictEqual } from 'assert';
import { describe, it } from "mocha";

import { JSDOM } from 'jsdom';

describe('DOMUtils#reviewInlineElement tests', () => {
  const test = (input: string, tag: string, expected: string) => {
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
    test('<p><strong>So</strong><strong>me</strong><strong> – </strong><strong>complicated&nbsp;</strong><strong>setup&nbsp;</strong><strong>found&nbsp;</strong><strong>on&nbsp;</strong><strong>real site.</strong></p>', 'strong', '<p><strong>Some – complicated setup found on real site.</strong></p>');
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

});

describe('DOMUtils#reviewParagraphs tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.reviewParagraphs(document);
    strictEqual(document.body.innerHTML, expected);
  }

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
});

describe('DOMUtils#reviewHeadings tests', () => {
  const test = (input: string, expected: string) => {
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

describe('DOMUtils#escapeSpecialCharacters tests', () => {
  const test = (input: string, expected: string) => {
    const { document } = (new JSDOM(input)).window;
    DOMUtils.escapeSpecialCharacters(document);
    strictEqual(document.body.innerHTML, expected);
  };

  it('escapeSpecialCharacters escape tidles', () => {
    test('<p>Paragraph with 2 tildes: 20~30 and 40~50</p>', '<p>Paragraph with 2 tildes: 20\\~30 and 40\\~50</p>');
  });
});

describe('DOMUtils#remove tests', () => {
  const test = (input: string, selectors, expected: string) => {
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
  const test = (input: string, expected: string) => {
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
  });

  describe('DOMUtils#removeSpans tests', () => {
    // tslint:disable-next-line: no-shadowed-variable
    const test = (input: string, expected: string) => {
      const { document } = (new JSDOM(input)).window;
      DOMUtils.removeSpans(document);
      strictEqual(document.body.innerHTML, expected);
    }

    it('remove spans', () => {
      // do nothing
      test('<p></p>', '<p></p>');

      // remove spans
      test('<p><span></span></p>', '<p></p>');
      test('<p><span>Content should remain</span> the same</p>', '<p>Content should remain the same</p>');
      test('<p>Spacing<span> should</span> remain the same</p>', '<p>Spacing should remain the same</p>');
      test('<p>Spacing<span> should</span> remain the <span>same even</span> with<span> multiple spans</span></p>', '<p>Spacing should remain the same even with multiple spans</p>');
    });
  });

  describe('DOMUtils#removeNoscripts tests', () => {
    // tslint:disable-next-line: no-shadowed-variable
    const test = (input: string, expected: string) => {
      strictEqual(DOMUtils.removeNoscripts(input), expected);
    }

    it('remove no scripts', () => {
      // do nothing
      test('<p>Some content</p>', '<p>Some content</p>');

      // remove noscript
      test('<body>Do A<noscript>Do Z</noscript></body>', '<body>Do A</body>');
      test('<body>Do A<noscript>Do Z</noscript> but also do B<noscript>and X</noscript></body>', '<body>Do A but also do B</body>');
      test('<body>Do A<noscript>Do Z\n Do X</noscript> but also do B<noscript>and W \ and Y</noscript></body>', '<body>Do A but also do B</body>');
    });
  });

  describe('DOMUtils#replaceByCaptions tests', () => {
    // tslint:disable-next-line: no-shadowed-variable
    const test = (input: string, selectors: string[], expected: string) => {
      const { document } = (new JSDOM(input)).window;
      DOMUtils.replaceByCaptions(document, selectors)
      strictEqual(document.body.innerHTML, expected);
    }

    it('replace by captions', () => {
      // do nothing
      test('<p>Some content</p>', ['i'], '<p>Some content</p>');

      test('<p>Some content</p><img src="image.png"><figcaption>Copyright to author.</figcaption><p>Some more content</p>', ['figcaption'], '<p>Some content</p><img src="image.png"><p><em>Copyright to author.</em></p><p>Some more content</p>');
      test('<p>Some content</p><img src="image.png"><figcaption>Copyright to author.</figcaption><div class="custom-caption">Another copyright to author.</div><p>Some more content</p>', ['figcaption', '.custom-caption'], '<p>Some content</p><img src="image.png"><p><em>Copyright to author.</em></p><p><em>Another copyright to author.</em></p><p>Some more content</p>');
    });
  });

  describe('DOMUtils#replaceEmbeds', () => {
    // tslint:disable-next-line: no-shadowed-variable
    const test = (input: string, expected: string) => {
      const { document } = (new JSDOM(input)).window;
      DOMUtils.replaceEmbeds(document)
      strictEqual(document.body.innerHTML, expected);
    }

    it('replace embeds', () => {
      // do nothing
      test('<p>Some content</p>', '<p>Some content</p>');
    });

    it('replace embeds deals with iframes', () => {
      test('<p>Some content</p><iframe src="https://www.youtube.com/xyz"></iframe>', '<p>Some content</p><hlxembed>https://www.youtube.com/xyz</hlxembed>');
      test('<p>Some content</p><iframe data-src="https://www.youtube.com/xyz"></iframe>', '<p>Some content</p><hlxembed>https://www.youtube.com/xyz</hlxembed>');
      test('<p>Some content</p><iframe data-src="https://www.youtube.com/data-src" src="https://www.youtube.com/src"></iframe>', '<p>Some content</p><hlxembed>https://www.youtube.com/data-src</hlxembed>');
    });

    it('replace embeds deals video tag / content blocks', () => {
      // Video block
      test('<p>Some content</p><video src="https://www.server.com/video.mp4"></video>', '<p>Some content</p><table><tbody><tr><th>Video</th></tr><tr><td><video src="https://www.server.com/video.mp4"></video></td></tr></tbody></table>');

      // Animation block
      test('<p>Some content</p><video src="https://www.server.com/video.mp4" autoplay="true"></video>', '<p>Some content</p><table><tbody><tr><th>Animation</th></tr><tr><td><video src="https://www.server.com/video.mp4" autoplay="true"></video></td></tr></tbody></table>');
    });
  });

  describe('DOMUtils#encodeImagesForTable', () => {
    // tslint:disable-next-line: no-shadowed-variable
    const test = (input: string, expected: string) => {
      const { document } = (new JSDOM(input)).window;
      DOMUtils.encodeImagesForTable(document)
      strictEqual(document.body.innerHTML, expected);
    }

    it('encode images for table', () => {
      // do nothing
      test('<p>Some content</p>', '<p>Some content</p>');

      // encode pipe if image is in table
      test('<p>Some content</p><table><tr><td><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe"></td></tr></table>', '<p>Some content</p><table><tbody><tr><td><img src="https://www.server.com/image.jpg" title="Some title \\| which contains a pipe"></td></tr></tbody></table>');

      // don't encode pipe if image is not in a table
      test('<p>Some content</p><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe">', '<p>Some content</p><img src="https://www.server.com/image.jpg" title="Some title | which contains a pipe">');
    });
  });
});