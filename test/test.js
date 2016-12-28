'use strict';
var expect = require('chai').expect,
    fs = require('fs-extra'),
    PSPublisher = require('../index').PSPublisher,
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;

var publish = new PSPublisher('./testDir'),
    url = 'mongodb://localhost:27017/blog';

publish.connect(url);

publish.models([{
    "name": "Test",
    "schema": {
        "title": String,
        "content": String
    }
}]);

publish.start();

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal(-1, [1,2,3].indexOf(4));
//     });
//   });
// });

// describe('PSPublisher', function() {

//     // describe('trackedFiles at start', () => {
//     //     it('should be empty before the script starts', () => {
//     //         fs.readFile('../lib/trackedFiles.json', function(data) {
//     //             expect(data).to.be.empty;
//     //         });
//     //     });
//     // });

//     // describe('log file start', () => {
//     //     it('should be empty', () => {
//     //         fs.readFile('../logs/all-logs.log', (data) => {
//     //             expect(data).to.be.empty;
//     //         });
//     //     });
//     // });

//     describe('Database', function() {
//         it('should show that two new records were inserted into the database after two files were created in the directory', function() {
//             fs.writeFile('./testDir/test-file1.json', { 'title': 'test1', 'content': 'None' }, (err) => {
//                 if (err) console.log(err);
//             });

//             MongoClient.connect(url, (err, db) => {
//                 if (err) console.log(err);

//                 db.collection('test').find({}).toArray((err, doc) => {
//                 	if (err) console.log(err);

//                     expect(doc).to.equal([{ 'title': 'test1', 'content': 'None' }]);
//                 });
//             });
//             assert.equal(1, 1);
//         });
//         // it('should show that two new records were inserted into the database after two files were moved into the directory', () => {
//         //     fs.writeFile('../test-file2.json', { 'title': 'test2', 'content': 'None' }, (err) => {
//         //         if (err) throw err;
//         //     });

//         //     fs.move('../test-file2.json', './testDir/test-file2.json', (err) => {
//         //         if (err) throw err;
//         //     });

//         //     fs.writeFile('../test-file3.json', { 'title': 'test3', 'content': 'None' }, function(err) {
//         //         if (err) throw err;
//         //     });

//         //     fs.move('../test-file2.json', './testDir/test-file3.json', (err) => {
//         //         if (err) throw err;
//         //     });

//         //     MongoClient.connect(url, (db, err) => {
//         //         db.collection('test').find({}).toArray((err, docs) => {
//         //             expect(docs).to.equal([
//         //                 { 'title': 'test', 'content': 'None' },
//         //                 { 'title': 'test3', 'content': 'None' },
//         //                 { 'title': 'test3', 'content': 'None' }
//         //             ]);
//         //         });
//         //     });
//         // });

//         // it('should show that after deleting a file from the directory, it is removed from the database', () => {
//         //     fs.remove('./test/test-file2.json', (err) => {
//         //         if (err) throw err;
//         //     });

//         //     fs.remove('./test/test-file3.json', (err) => {
//         //         if (err) throw err;
//         //     });

//         //     MongoClient.connect(url, (db, err) => {
//         //         db.collection('test').find({}).toArray((err, docs) => {
//         //             expect(docs).to.equal([{ 'title': 'test', 'content': 'None' }]);
//         //         });
//         //     });
//         // });

//         // it('should show that after removing all the files out of the directory, the database is empty', () => {
//         //     fs.emptyDir('./test', (err) => {
//         //         if (err) throw err;
//         //     });

//         //     MongoClient.connect(url, (db, err) => {
//         //         db.collection('test').find({}).toArray((err, docs) => {
//         //             expect(docs).to.equal([]);
//         //         });
//         //     });
//         // });

//         // it('should show that after stopping the script and removing a file into the directory, the database has one less record', () => {
//         //     publish.exit();
//         //     fs.remove('test', function(data) {

//         //     });
//         //     publish.connect(uri).start();
//         //     MongoClient.get;
//         //     expect.to.equal();
//         // });

//         // it('should show that after stopping the script and adding a file into the directory, the database has one less record', () => {
//         //     publish.exit();
//         //     fs.writeFile('test', function(data) {

//         //     });
//         //     publish.connect(uri).start();
//         //     MongoClient.get;
//         //     expect.to.equal();
//         // });
//     });

//     // describe('Directory', () => {
//     //     it('should not have a document in database if a file other than json is moved into directory', () => {
//     //         fs.move('file');
//     //         MongoClient.;
//     //         expect().to.equal("");
//     //     });

//     //     it('should add the file that is moved into the directory as being watched', () => {
//     //         expect().to.equal("");
//     //     });

//     //     it('should return an error if a file that does not have a valid model is moved into the directory', () => {
//     //         expect().to.equal("");
//     //     });
//     // });

//     // describe('trackedFiles file', () => {
//     //     it('should have the same number of files being watched as the number of files in the directory', () => {
//     //         var items = [];

//     //         fs.walk('./test')
//     //             .on(data, (item) => {
//     //                 items.push(item.path)
//     //             });

//     //         MongoClient.connect(url, (db, err) => {
//     //             db.collection('test').find({}).toArray((err, docs) => {
//     //                 expect(docs.length).to.equal(items.length);
//     //             });
//     //         });
//     //     });

//     //     it('should equal one less if a file is moved out of the directory', () => {
//     //         fs.move('./test/test-file1.json', './test-file1.json', (err) => {
//     //             if (err) throw err;
//     //         });
//     //         fs.readFile('../lib/trackedFiles.json', function(data) {
//     //             var contents = JSON.parse(data);
//     //             expect(contents).to.have.length(1);
//     //         });
//     //     });

//     //     it('should equal one more if a file is moved into the directory', () => {
//     //         fs.move('./test-file1.json', './test/test-file1.json', (err) => {
//     //             if (err) throw err;
//     //         });
//     //         fs.readFile('../lib/trackedFiles.json', function(data) {
//     //             var contents = JSON.parse(data);
//     //             expect(contents).to.have.length(1);
//     //         });
//     //     });
//     // });

//     // describe('trackedFiles later', () => {
//     //     it('should not be empty when there are files in the directory', () => {
//     //         fs.write('./test/test-file4.json', (err) => {
//     //             if (err) throw err;
//     //         });

//     //         fs.readFile('../lib/trackedFiles.json', (err, data) => {
//     //             expect(data).to.not.be.empty;
//     //         });
//     //     });

//     //     it('should be empty when there are no collections in the database', () => {
//     //         fs.emptyDir('./test', (err) => {
//     //             if (err) throw err;
//     //         });

//     //         fs.readFile('../lib/trackedFiles.json', (err, data) => {
//     //             expect(data).to.be.empty;
//     //         });
//     //     });
//     // });

//     // describe('log file', () => {
//     //     it('should not be empty', () => {
//     //         fs.readFile('../logs/all-logs.log', (err, data) => {
//     //             if (err) throw err;
//     //             expect(data).to.not.be.empty;
//     //         });
//     //     });
//     // });
// });
