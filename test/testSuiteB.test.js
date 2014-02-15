/**
 * @fileOverview
 * A trivial Selenium test.
 *
 * Has access to:
 *
 * global.config
 * global.browser
 */

describe('test page B', function () {
  it('navigate to index page', function () {
    var url = global.config.server.protocol +
      '://' + global.config.server.host +
      ':' + global.config.server.port;

    return global.browser.get(url);
  });

  it('read title', function () {
    return global.browser
      .title().should.become('Selenium Service Example Test Pages');
  });

  it('click to navigate to test page, read title', function () {
    return global.browser
      .elementById('link-b')
      .click()
      .title().should.eventually.include('Test Page B');
  });

  it('check element contents', function () {
    return global.browser
      .elementById('div-b')
      .text().should.become('B');
  });
});
