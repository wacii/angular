import {verifyNoBrowserErrors} from '@angular/testing/src/e2e_util';

describe('Person Management CRUD', function() {
  var URL = 'playground/src/person_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
