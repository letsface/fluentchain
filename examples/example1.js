'use strict';

var fluent = require('../fluent.js');
var util = require('util');
var Q = require('q');

//Q.longStackSupport = true;

function externalInitializationFunction(param) {
  return Q(param);
}

function Example(instanceParameter, $log) {
  Example.super_.call(this, $log);

  var self = this;

  // this is our internal state
  self.value = 0;

  self.chain(function() {
    // initialization at the beginning of the chain
    // this could be a database connection for example
    return externalInitializationFunction(instanceParameter)
      .then(function(initValue) {
        if(!typeof initValue === 'number') {
          throw new Error('Invalid or missing parameter');
        }
        // we do something with return from initialization function
        self.value = initValue;
      });
  });

  // calls to this chains the function operation
  self.add = function(explicit) {
    self.chain(function(implicit) {
      // we insert either an explicit parameter or the result
      // from the previous step in the chain
      var operand = self.either(explicit, implicit);
      self.value += operand;
      // we pass the value to the next step in the chain
      // we can either return a value or a promise
      return Q(self.value);
    });
    // always return self so we can use dot notation
    return self;
  }

  // another operation, this ones retrieves data
  // externally (for example, DB insert operation)
  self.insert = function(v) {
    self.chain(function() {
      // pass the value at this point in the chain
      // could also be a promise
      return v;
    });
    return self;    
  }

  // promises allow skipping rest of the chain on error
  self.artificialError = function() {
    self.chain(function() {
      throw new Error('fake');
    }) 
    return self;
  }
};

util.inherits(Example, fluent);

/* outputs:
will add one
will add 10
21
ignoring error fake
21
*/

function main($log) {
  var example = new Example(10, $log);
  var store = {};
  return example
    .log('will add one')
    .add(1)  
    .log('will add 10')
    .insert(10)
    .add() 
    .log() // outputs 12
    .store(store, 'result')
    .ignoreNextError()
    .artificialError()
    .retrieve(store, 'result')
    .promiseData()

}

exports.main = main;

if(require.main === module) {
  main(console)
    .then(function(value) {
      console.log(value); // outputs 12
    })  
    .fail(function(err) {
      console.log(err.message);
      console.log(err.stack);
    })
    .done();
}
