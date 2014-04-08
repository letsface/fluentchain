'use strict';

var fluent = require('../fluent.js');
var util = require('util');
var Q = require('q');

function ExampleStoreRetrieve($log) {
  ExampleStoreRetrieve.super_.call(this, $log);
};

util.inherits(ExampleStoreRetrieve, fluent);

describe('ExampleStoreRetrieve', function() {
  it('can store and retrieve simple values to the internal store', function(done) {
    var example = new ExampleStoreRetrieve(console);
    example
      .chain(function() {
        return 42;
      })
      .store('var')
      .chain(function(previousStep) {
        expect(previousStep).toEqual(42);
      })
      .retrieve('var')
      .chain(function(previousStep) {
        expect(previousStep).toEqual(42);
      })      
      .promiseNoData()
      .then(done)
      .fail(done)
      .done()
  });

  it('can store and retrieve simple values from an arbitrary store', function(done) {
    var example = new ExampleStoreRetrieve(console);
    var store = {};
    example
      .chain(function() {
        return 3.1415;
      })
      .store('var', store)
      .chain(function(previousStep) {
        expect(previousStep).toEqual(3.1415);
      })
      .retrieve('var', store)
      .chain(function(previousStep) {
        expect(previousStep).toEqual(3.1415);
      })      
      .promiseNoData()
      .then(done)
      .fail(done)
      .done()
  });

  it('rejects storing to a null object', function(done) {
    var example = new ExampleStoreRetrieve(console);
    var store = null;
    example
      .chain(function() {
        return 3.1415;
      })
      .store('var', store)
      .promiseNoData()
      .then(done.bind(null, 'should fail with a null store'))
      .fail(function(err) {
        expect(err.message).toEqual('cannot store to explicit null parameter');
        done();
      })
      .done()
  });

  it('cannot retrieve what has not been stored', function(done) {
    var example = new ExampleStoreRetrieve(console);
    example
      .retrieve('var')
      .promiseNoData()
      .then(done.bind(null, 'should fail when nothing has been stored yet'))
      .fail(function(err) {
        expect(err.message).toEqual('no target object or internal store to retrieve from');
        done();
      })  
      .done()
  });  
});
