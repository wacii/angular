import {verifyNoBrowserErrors} from '@angular/testing/src/e2e_util';

describe('Order Management CRUD', function() {
  var URL = 'playground/src/order_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
