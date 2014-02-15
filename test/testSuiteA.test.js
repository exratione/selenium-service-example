/**
 * @fileOverview
 * A trivial Selenium test.
 *
 * Has access to:
 *
 * global.config
 * global.browser
 */

describe('test page A', function () {
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
      .elementById('link-a')
      .click()
      .title().should.eventually.include('Test Page A');
  });

  it('check element contents', function () {
    return global.browser
      .elementById('div-a')
      .text().should.become('A');
  });
});
