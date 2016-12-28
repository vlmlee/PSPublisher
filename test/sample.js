var path = require('path'),
	directory = path.join(__dirname, 'test-directory');

let model = [{
	"name": "Test",
	"schema": {
		"test": String,
		"sample": String
	}
}];

var PSPublisher = require('../index').PSPublisher,
	publish = new PSPublisher(directory, model); 

publish.connect('mongodb://localhost/app');

publish.start();

