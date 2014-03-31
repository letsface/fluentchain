'use strict';

var Q = require('q');

function FluentError (msg) {
  this.name = 'FluentError';
  this.message = msg;
  this.stack = (new Error()).stack;
};

function Fluent($log) {
  var self = this;

  if(!$log || !$log.log) {
    $log = console;
  }

  self.either = function(explicit, implicit, noException) {
    var selected = explicit;
    if(!selected && typeof selected !== 'object') {
      if(!implicit && typeof implicit !== 'object') {
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

  self.store = function(target, propertyName) {
    self.chain(function(previousStepData) {
      if(typeof target !== 'object') {
        return Q.reject(new Error('target is not object'));
      }
      if(typeof propertyName !== 'string') {
        return Q.reject(new Error('propertyName is not string'));
      }
      target[propertyName] = previousStepData;
      return previousStepData;
    });
    return self;
  }

  self.retrieve = function(target, propertyName) {
    self.chain(function() {
      if(typeof target !== 'object') {
        return Q.reject(new Error('target is not object'));
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

  self.reset();

  return self;  
}

module.exports = Fluent;
