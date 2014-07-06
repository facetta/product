var assert = require('assert'),
  ProductAPI = require('..'),
  request = require('supertest');

describe('app', function() {
  it('should do something', function(){
    var productAPI = new ProductAPI();
    assert(productAPI);
  });
});
