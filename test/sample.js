var PSPublisher = require('../index');

var publish = new PSPublisher('./test');

publish.connect('mongodb://localhost/app');

publish.models([{
	"name": "Test",
	"schema": {
		"test": String,
		"sample": String
	}
}]);

publish.start();

