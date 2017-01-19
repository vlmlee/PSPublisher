'use strict';
const expect = require('chai').expect,
    fs = require('fs'),
    pspublisher = require('../index').pspublisher,
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;

// const path = require('path'),
//     directory = path.join(__dirname, 'test-directory'),
//     model = [{
//         "name": "Test",
//         "schema": {
//             "test": String,
//             "content": String,
//             "file": String,
//         },
//         "collection": "testdb"
//     }],
//     publish = new pspublisher(directory, model); 

// publish.connect('mongodb://localhost/app').start();
// publish.start();

describe('Pspublisher tests', function() {
    describe('trackedFiles at start', () => {
        it('should be empty before the script starts', () => {
            fs.readFile('../lib/trackedFiles.json', function(data) {
                expect(data).to.be.empty;
            });
        });
    });

    describe('log files at start', () => {
        it('should be empty', () => {
            fs.readFile('../logs/all-logs.log', (data) => {
                expect(data).to.be.empty;
            });
        });
    });
    
    // describe('Database', function() {
    //     it('should show that a new record was inserted into the database after a file was created in the directory', () => {
    //         fs.writeFile('./test-directory/test-file1.json', { 'name': 'test1', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (err, db) => {
    //             if (err) throw err;
    //             db.collection('test').find({}).toArray((err, doc) => {
    //                 if (err) throw err;
    //                 expect(doc).to.eql([{ 'name': 'test1', 'content': 'None', 'file': '' }]);
    //             });
    //         });
    //     });

    //     it('should show that a new record was inserted into the database after a file was moved in the directory', () => {
    //         fs.writeFile('./loading-directory/test-file2.json', {'name': 'test2', 'content': 'None'}, (err) => {
    //             if (err) throw err;
    //         });

    //         fs.move('./loading-directory/test-file2.json', './test-directory/test-file2.json', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (err, db) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, doc) => {
    //                 if (err) throw err;
    //                 expect(doc).to.eql([
    //                     {'name': 'test1', 'content': 'None', 'file': ''}, 
    //                     {'name': 'test2', 'content': 'None', 'file': ''}]);
    //             });
    //         });
    //     });

    //     it ('should show that two new records were inserted into the database if two files are moved into the directory', () => {
    //         fs.writeFile('./loading-directory/test-file3.json', { 'name': 'test3', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         fs.writeFile('./loading-directory/test-file4.json', { 'name': 'test4', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         fs.move('./loading-directory/test-file3.json', './test-directory/test-file3.json', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.move('./loading-directory/test-file4.json', './test-directory/test-file4.json', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([
    //                     { 'name': 'test1', 'content': 'None', 'file': '' },
    //                     { 'name': 'test2', 'content': 'None', 'file': '' },
    //                     { 'name': 'test3', 'content': 'None', 'file': '' },
    //                     { 'name': 'test4', 'content': 'None', 'file': '' }
    //                 ]);
    //             });
    //         });
    //     });

    //     it('should show that after deleting a file from the directory, it is removed from the database', () => {
    //         fs.remove('./test-directory/test-file2.json', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.remove('./test/test-file3.json', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([
    //                     { 'name': 'test1', 'content': 'None', 'file': '' }, 
    //                     { 'name': 'test4', 'content': 'None', 'file': '' }
    //                 ]);
    //             });
    //         });
    //     });

    //     it('should show that after removing all the files out of the directory, the database is empty', () => {
    //         fs.emptyDir('./test-directory', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([]);
    //             });
    //         });
    //     });
        
    //     it('should show that after stopping the script and removing a file into the directory, the database has one less record', () => {
    //         fs.writeFile('./test-directory/test-file1.json', { 'name': 'test1', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         publish.exit();

    //         fs.remove('./test-directory/test-file1.json', (err) => {
    //             if (err) throw err;
    //         });

    //         publish.connect(uri).start();

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([]);
    //             });
    //         });
    //     });

    //     it('should show that after stopping the script and adding a file into the directory, the database has one more record', () => {
    //         publish.exit();

    //         fs.writeFile('./test-directory/test-file1.json', { 'name': 'test1', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         publish.connect(uri).start();

    //         MongoClient.connect(url, (err, db) => {
    //             if (err) throw err;
    //             db.collection('test').find({}).toArray((err, doc) => {
    //                 if (err) throw err;
    //                 expect(doc).to.eql([{ 'name': 'test1', 'content': 'None', 'file': '' }]);
    //             });
    //         });
    //     });
    // });

    // describe('Directory', () => {
    //     it('should not add a document to database if a non-json file is added into the directory', () => {
    //         fs.writeFile('./test-directory/test.txt', 'Wrong format', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([]);
    //             });
    //         });

    //         fs.remove('./test-directory/test.txt', (err) => {
    //             if (err) throw err;
    //         });
    //     });

    //     it('should not add document to database if a file that does not have a valid model is moved into the directory', () => {
    //         fs.writeFile('./test-directory/test.json', (err) => {
    //             if (err) throw err;
    //         });

    //         MongoClient.connect(url, (db, err) => {
    //             if (err) throw err;
    //             db.collection('testdb').find({}).toArray((err, docs) => {
    //                 expect(docs).to.eql([]);
    //             });
    //         });

    //         fs.remove('./test-directory/test.json', (err) => {
    //             if (err) throw err;
    //         });
    //     });
    // });

    // describe('trackedFiles file', () => {
    //     it('should not be empty when there are files in the directory', () => {
    //         fs.write('./test-directory/test-file4.json', { 'name': 'test4', 'content': 'None' }, (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../lib/trackedFiles.json', (err, data) => {
    //             expect(data).to.not.be.empty;
    //         });
    //     });

    //     it('should have the same number of files being watched as the number of files in the directory', () => {
    //         var items = [];

    //         fs.walk('./test-directory').on('data', (item) => {
    //                 items.push(item.path)
    //             });

    //         MongoClient.connect(url, (db, err) => {
    //             db.collection('test').find({}).toArray((err, docs) => {
    //                 expect(docs.length).to.equal(items.length);
    //             });
    //         });
    //     });

    //     it('should equal one less if a file is moved out of the directory', () => {
    //         fs.move('./test-directory/test-file1.json', './loading-directory/test-file1.json', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../lib/trackedFiles.json', (data) => {
    //             var contents = JSON.parse(data);
    //             expect(contents).to.have.length(1);
    //         });
    //     });

    //     it('should equal one more if a file is moved into the directory', () => {
    //         fs.move('./loading-directory/test-file1.json', './testing-directory/test-file1.json', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../lib/trackedFiles.json', (data) => {
    //             var contents = JSON.parse(data);
    //             expect(contents).to.have.length(2);
    //         });
    //     });

    //     it('should be empty when there are no documents in the database', () => {
    //         fs.emptyDir('./test-directory', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../lib/trackedFiles.json', (err, data) => {
    //             expect(data).to.be.empty;
    //         });
    //     });
    // });

    // describe('trackedFiles at end of testing', () => {
    //     it('should be empty after tests end', () => {
    //         fs.writeFile('../lib/trackedFiles.json', '', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../lib/trackedFiles.json', (data) => {
    //             expect(data).to.be.empty;
    //         });
    //     });
    // });

    // describe('log files at end of testing', () => {
    //     it('should be empty after tests end', () => {
    //         fs.writeFile('../logs/all-logs.log', '', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.writeFile('../logs/exceptions.log', '', (err) => {
    //             if (err) throw err;
    //         });

    //         fs.readFile('../logs/all-logs.log', (data) => {
    //             expect(data).to.be.empty;
    //         });

    //         fs.readFile('../logs/exceptions.log', (data) => {
    //             expect(data).to.be.empty;
    //         });
    //     });
    // });
});
