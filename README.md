# Overview

A helper for creating nicely chained Javascript interfaces with promises.

## Usage

install:

```
npm install fluentchain
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