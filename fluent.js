'use strict';

var Q = require('q');

function FluentError (msg) {
  this.name = 'FluentError';
  this.message = msg;
  this.stack = (new Error()).stack;
};

function Fluent($log) {
  var self = this;

  var internalStore = undefined;

  if(!$log || !$log.log) {
    $log = console;
  }

  self.either = function(explicit, implicit, noException) {
    var selected = explicit;
    if(typeof selected === 'undefined') {
      if(typeof implicit === 'undefined') {
        if(noException) {
          return null;
        } else {
          throw new FluentError('No valid parameter alternatives ' + explicit + ' OR ' + implicit);  
        }        
      }
      selected = implicit;
    } 
    return selected;
  }

  self.reset = function() {
    self._promise = Q();      
  }

  self.store = function(entityName, targetObject) {
    self.chain(function(previousStepData) {
      if(typeof targetObject !== undefined && targetObject === null) {
         return Q.reject(new Error('cannot store to explicit null parameter'));
      }
      targetObject = self.either(targetObject, internalStore, true);
      if(targetObject === null || typeof targetObject !== 'object') {
        internalStore = {};  
        targetObject = internalStore;
      }
      
      if(typeof targetObject !== 'object') {
        return Q.reject(new Error('targetObject is not object'));
      }
      if(typeof entityName !== 'string') {
        return Q.reject(new Error('entityName is not string'));
      }

      targetObject[entityName] = previousStepData;

      //passthrough to the next step
      return previousStepData;
    });

    return self;
  }

  self.retrieve = function(propertyName, target) {
    self.chain(function() {
      target = self.either(target, internalStore, true);

      if(target === null || typeof target !== 'object') {
        return Q.reject(new Error('no target object or internal store to retrieve from'));
      }

      if(typeof propertyName !== 'string') {
        return Q.reject(new Error('propertyName is not string'));
      }
      return Q(target[propertyName]);
    });
    return self;
  }  

  self.promiseNoData = function() {
    var p = self._promise.then(function(valueToIgnore) {
      // don't confuse callers with the last step 
      // return value 
      return;
    });

    self.reset();
    return p;
  }

  self.promiseData = function() {
    var p = self._promise.then(function(data) {
      if(data === undefined) {
        return Q.reject(new FluentError('No data passed from previous step'));
      }
      return data;
    });

    self.reset();    
    return p;
  }

  self.chain = function(cb) {
    if(self._ignoreErrors) {
      self._promise = self._promise
          .then(function() {
            return Q()
              .then(cb)
              .fail(function(err) {
                $log.log('ignoring error ' + err.message);
              });
          })
      self._ignoreErrors = false;
    } else if(self.errClass) {
      var errClass = self.errClass;
      delete self.errClass;      
      self._promise = self._promise
        .then(cb)
        .fail(function(err) {
          var exception = new errClass;
          // keep original exception messages
          exception.stack = err.stack;
          exception.message = exception.message + ': ' + err.message;
          return Q.reject(exception);
        });
    } else {
      self._promise = self._promise.then(cb);  
    }
    
    return self;
  }

  self.catchNext = function(errClass) {
    self.errClass = errClass;
    return self;
  }

  self.ignoreNextError = function() {
    self._ignoreErrors = true;
    return self;
  }

  self.log = function(explicit) {
    self.chain(function(implicit) {
      var selected = self.either(explicit, implicit);
      $log.log(selected);
      return implicit;
    });
    return self;
  }

  self.next = function(cb) {
    self._promise = self._promise.then(cb);
    return self;
  }

  self.single = function(data) {
    self.chain(function(array) {
      if(array.length !== 1) {
        return Q.reject(new FluentError('Expected length 1, got ' + array.length));
      }
      return array[0];
    })
    return self;
  }

  self.finish = function(done) {
    self.promiseNoData()
        .then(done)
        .fail(done)
        .done();
    return self;
  }

  self.set = function(storeName, propertyName, target) {
    self.chain(function(previousStepData) {

      target = self.either(target, previousStepData);

      if(internalStore === null) {
        throw new FluentError('No internal store');
      }
      if(!internalStore[storeName]) {
       throw new FluentError('Invalid entity ' + storeName + ', available: ' + Object.keys(internalStore)); 
      }
      if(!internalStore[storeName][propertyName]) {
       throw new FluentError('No such property ' + propertyName + ', available: ' + Object.keys(internalStore[storeName]));
      }

      target[propertyName] = internalStore[storeName][propertyName];
      
      return previousStepData;

    });
    
    return self;
  }

  self.reset();

  return self;  
}

module.exports = Fluent;
