# Overview

A helper for creating nicely chained Javascript interfaces with promises.

## Features

* use dot notation to express sequences of operations
* use previous step value or explicit parameters
* eventual store/retrieve
* return Q promises, with or without data

## Usage

install:

```
npm install git+ssh://git@github.com/letsface/fluentchain.git
```

outline:

```
var fluent = require('fluentchain');
var util = require('util');

function YourFluentInterface() {
	Example.super_.call(this, $log);
	//fill in with your own methods, 
	//probably functions inside self.chain...	
}
util.inherits(Example, fluent);
```

See examples/example1.js for more.

## Other published projects using fluentchain

* https://github.com/letsface/pgspjs