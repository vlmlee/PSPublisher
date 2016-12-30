var path = require('path'),
	directory = path.join(__dirname, 'test-directory');

let model = [{
	"name": "Test",
	"schema": {
		"test": String,
		"sample": String
	}
}];

var pspublisher = require('../index').pspublisher,
	publish = new pspublisher(directory, model); 

publish.connect('mongodb://localhost/app');

publish.start();

