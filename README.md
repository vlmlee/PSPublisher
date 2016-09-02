# Pretty Simple Publisher

PSPublisher is a module for automatic, asynchronous CRUD operations on a Mongo database. 

### Installation

To install, run:

```bash
npm install PSPublisher
```

Alternatively, you can clone this repo with `git clone https://github.com/vlmlee/PSPublisher.git` and then run `npm install` from inside the cloned directory to install the dependencies.

## Overview 

```
PSPublisher/
├── index.js
├── lib/
│   └── trackedFiles.json
├── logs/
│   ├── all-logs.log
│   └── exceptions.log
└── test/
    ├── database.js
    ├── sample.js
    ├── test.js
    └── test.json
```

### Motivation

This module was created for personal use on a blog.

### Usage

```js
var publish = require('PSPublisher');

publish('./files/').connect('mongodb://localhost/myapp');

```

After doing so, you want to create a model by using an array with two fields: name and schema. You can define the schema
to be anything you like, as long as your documents match that schema. 

PSPublisher currently has no support for subdocuments. 

```js

publish.models([{
	name: 'Posts',
	schema: {
		title: String,
		body: String,
		url: String
	}
}]);
```

Then you run 

```js

publish.start();

```

to initialize the script.

### Recommendations

For the time being, only json files are supported. 

#### Protect trackedFiles.json

Don't modify this file.

### Tests

Coming soon.

### Further Work

A lot of further work needs to be done.

#### Author: [Michael Lee]{http://www.corollari.com}
## License: MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
