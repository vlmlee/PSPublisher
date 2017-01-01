const path = require('path'),
	directory = path.join(__dirname, 'test-directory'),
	model = [{
		"name": "Test",
		"schema": {
			"test": String,
			"sample": String,
			"file": String,
		},
		"collection": "testdb"
	}],
	pspublisher = require('../index').pspublisher,
	publish = new pspublisher(directory, model); 

publish.connect('mongodb://localhost/app').start();