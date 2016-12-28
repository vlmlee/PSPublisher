# Pretty Simple Publisher

PSPublisher is a module for automatic, asynchronous CRUD operations on a Mongo database. 

## !!! WARNING !!!

Not yet compatible with ES2016.

### Installation

You can clone this repo with `git clone https://github.com/vlmlee/PSPublisher.git` and then run `npm install` from inside the cloned directory to install the dependencies.

Later, you will be able to install this module by running:

```bash
npm install PSPublisher
```

This will be after I finish the testing suite for it.

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
    ├── sample.js
    ├── test.js
    └── test.json
```

### Motivation

This module was created for personal use on a blog. I thought it was unneccessary to have to write forms for your *own* website when we had all these powerful tools that could handle those file operations for us. A web application is ["just a wrapper around a database"][1] afterall. 

So why not automate the process? And so we did.

### Usage

PSPublisher is built on top of [chokidar][2] and [mongoose][3]. Both are mature and robust modules that made this project possible. Both are built with asynchronicity in mind.

For now, we will want to use PSPublisher like this if it's in the same path:

```js
var publisher = require('./index');
```

Later, we'll be able to require it just like any other node module.

```js
var publisher = require('PSPublisher');
```

To use it, we define a path or directory that we want it to watch. We then also tell it what database to send our documents to.

```js
publisher(path);
publisher.connect('mongodb://localhost/myapp');

// or chained:

publisher(path).connect('mongodb://localhost/myapp');
```

After doing so, we can define a model to structure our documents. With this module, we want to create a model by using an array with two fields: name and schema. You can define the schema to be anything you like, as long as your documents match that schema. PSPublisher currently has no support for subdocuments. 

```js
publisher.models([{
	name: 'Posts',
	schema: {
		title: String,
		body: String,
		url: String
	}
}]);
```

Then you run the script with:

```js

publisher.start();

```

Then, just set up your mongo database, move your files into that directory, and voila! It shows up in your database.

### Recommendations

For the time being, only json files are supported. Make sure your schemas that have important requirements uses **required**. Also, as of right now, you can only use *one* schema for *one* instance of PSPublisher. 

To have the script automatically exit when an exception is thrown, you will want to change `exitOnError` on the logger to true:

```js
publisher.logger({exitOnError: true});
```


### Protect trackedFiles.json

Don't modify this file.

### Tests

Coming soon.

### Further Work

A lot of further work needs to be done. Validating schemas, more support for multiple schemas and other files are in consideration. Some slight optimizations could also be done.

### Author: Michael Lee [http://www.corollari.com][4]

[1]: https://www.youtube.com/watch?v=csyL9EC0S0c
[2]: https://github.com/paulmillr/chokidar
[3]: https://github.com/Automattic/mongoose
[4]: http://www.corollari.com

### License: MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
