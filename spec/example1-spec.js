'use strict';

var example1 = require('../examples/example1.js');

describe('example1', function() {
	it('runs correctly', function(done) {
		var logs = [];
		var collector = {
			log: function(line) {
				logs.push(line);
			}
		}

		example1
			.main(collector)
			.then(function() {
				expect(logs).toEqual([
           'will add one', 
           'will add 10', 
           21, 
           'ignoring error fake'
				]);
			})
			.then(done)
			.fail(done)
			.done()
	});
});
