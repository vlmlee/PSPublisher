'use strict';
const fs = require('fs'),
    chokidar = require('chokidar'),
    winston = require('winston'),
    mongoose = require('mongoose'),
    junk = require('junk'),
    path = require('path'),
    ObjectId = require('mongodb').ObjectID;

/*  
    ---------------------
       Winston Logger
    ---------------------

    Instances of winston are event emitters and winston transports 
    are lazy-loaded getters. Each log message will output into a log file 
    and/or the console as a stream. There are different log levels you can use, 
    where the levels are prioritized from 0 to 7 (highest to lowest). You can 
    colorize them as well as define your own levels.

    Default:
    { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }

    The use cases look like:
    logger.warn('message'),
    logger.emerg('message'),
    logger.info('message'), 
    or (generically) logger.log('%level', 'message').
*/

const logger = new winston.Logger({
    transports: [
        new(winston.transports.Console)({
            levels: {
                crit: 0,
                error: 1,
                warning: 2,
                notice: 3,
                info: 4,
                debug: 5
            },
            colors: {
                crit: 'magenta',
                error: 'red',
                warning: 'yellow',
                notice: 'grey',
                info: 'green',
                debug: 'blue',
            },
            colorize: true,
            prettyPrint: true,
        }),
        new winston.transports.File({ filename: './logs/all-logs.log' })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './logs/exceptions.log' })
    ],
    exitOnError: false // winston will *not* exit after logging an uncaught 
        // exception. We should change this to true when not 
        // in a development environment.
});

/*  
    -----------------------------
        Main pspublisher Class  
    -----------------------------
    
    * Register Schemas in order to interface with Database using Mongoose.
    * We opt here to have user defined models passed in as an array.

    Example:

        pspublisher( { directory } , [{
            name: 'Posts',
            schema: {
                'title': title,
                'body': body,
            },
            collection: 'mycollection'
        }]);

    Currently does not have support for subdocuments. 
*/

class pspublisher {
    constructor(directory, modelsArray) {
        this._directory = directory;
        this._models = (function(models) {
            let modelNames = [];
            if (!models) {
                logger.log('error', "Invalid model. Please use proper formatting" + " or a valid schema.");
            }
            if (!Array.isArray(models)) {
                logger.log('error', "Invalid model. Please use proper formatting" + " or a valid schema.");
            }
            for (let i = 0; i < models.length; i++) {
                let Schema = new mongoose.Schema(models[i].schema, { timestamps: true });
                mongoose.model(models[i].name, Schema, models[i].collection);
                modelNames.push(models[i].name);
            }
            return modelNames;
        })(modelsArray);
        this._stack = [];
    }

    start() {
        logger.log('info', "pspublisher is starting...");
        const dir = this._directory;
        const self = this;

        // Trim off the end of the path since chokidar have absolute directory
        // paths without a trailing backslash. This will protect users.
        if (dir[dir.length - 1] === '/') {
            dir = dir.substring(0, dir.length - 1);
        }

        // This will initialize the watcher, i.e. the main event emitter. We will
        // be calling watch() on an instance of pspublisher to use it as a wrapper
        // around chokidar with preconfigured events.
        const watcher = chokidar.watch(dir, {
            ignored: [
                /[\/\\]\./,
            ],
            persistent: true,
            awaitWriteFinish: true,
            ignoreInitial: true,
        });

        watcher.on('ready', () => {
            logger.log('info', "Began watching " + dir);
            /* 
                Checks and sees what files are currently being watched. Chokidar also
                tracks the directory itself so it's necessary to grab the property that 
                only has the files. Our file listings is going to be our canonical record.
                Our "tracked files" in trackedFiles.json holds the id of the documents in 
                our database when they were first added. When the file is no longer in the 
                directory, we will remove the document from the database and then untrack it.
            */
            const model = mongoose.model(self._models[0]);
            const Watched = watcher.getWatched();
            let fileListings = Watched[dir].sort();
            let trackedKeys = [],
                trackedValues = [];

            // Reconcile the file listings with the record of tracked files. This 
            // will be used to update the database on this script's startup.
            fs.readFile(path.join(__dirname, './lib/trackedFiles.json'), 'utf8', (err, data) => {
                if (err) {
                    logger.log('error', "An error occurred with trackedFiles file. Was not able to read file.");
                }

                let trackedFiles;
                if (data) {
                    trackedFiles = JSON.parse(data),
                    trackedKeys = trackedFiles.map(i => path.basename(Object.keys(i)[0])).sort(),
                    trackedValues = trackedFiles.map(i => {
                        for (let key in i) {
                            if (Object.prototype.hasOwnProperty.call(i, key)) {
                                return i[key];
                            }
                        }
                    }).sort();
                }

                if (arrayEquals(fileListings, trackedKeys)) {
                    logger.log('info', "Files are in sync. Checking database...");
                } else if (fileListings.length === 0) {
                    logger.log('info', "There are currently no files in ./" + path.basename(dir) + ".");
                } else {
                    logger.log('info', "Files in ./" + path.basename(dir) + " are not in sync.");
                    self.syncFiles(fileListings, trackedKeys, dir);
                }
            });
                
            let removeFromDatabase = [],
                insertToDatabase = [];

            setTimeout(() => {
                if (trackedKeys.length !== 0) {
                    model.find({}, (err, docs) => {
                        let docFiles = docs.map(doc => doc.file),
                            docIds = docs.map(doc => doc._id.toString());
                        /* 
                            If the number of documents in the database
                            is greater than the number being tracked,
                            we want to find all documents in the
                            collection not being tracked and remove
                            them. 
                        */
                        if (docIds.length > trackedValues.length) {
                            removeFromDatabase = docIds.filter(id => {

                                // filter out files found in database that
                                // are being tracked
                                return (trackedValues.indexOf(id) !== -1) ? false : true;
                            });

                        // If the number of documents in the database
                        // is less however, we find the files being tracked
                        // that are missing from the database and add them.
                        } else if (docFiles.length < trackedKeys.length) {
                            insertToDatabase = trackedKeys.filter(key => {

                                // filter out files being tracked that are 
                                // in database
                                return (docFiles.indexOf(path.resolve(dir, key)) !== -1) ? false : true;
                            });
                        }
                    });
                }
            }, 500);

            setTimeout(() => {
                if (removeFromDatabase.length !== 0 || insertToDatabase.length !== 0) {
                    removeFromDatabase.map(id => self.removeFile(id, 'db'));
                    insertToDatabase.map(file => self.insertFile(path.resolve(dir, file), 'db'));
                    logger.log('info', 'Database is syncing.');
                } else {
                    logger.log('info', 'Database is synced. Will be listening for changes.')
                }
            }, 650);
        });

        watcher.on('add', (file) => {
            logger.log('info', path.basename(file) + " was added to ./" + path.basename(dir) + ".");
            self.insertFile(file, dir);
        });

        watcher.on('change', (file, stats) => {
            logger.log('info', path.basename(file) + " was modified at " + stats.mtime + ".");
            self.updateFile(file, dir);
        });

        watcher.on('unlink', (file) => {
            logger.log('info', path.basename(file) + " was removed from ./" + path.basename(dir) + ".");
            self.removeFile(file, dir);
        });
    }

    connect(uri) {
        mongoose.connect(uri);

        // Confirms successful database connection
        mongoose.connection.once('connected', function(err) {
            if (err) {
                next(err);
                logger.log('error', "Couldn't connect to " + uri + ".");
            }
            
            logger.log('info', "Connected to " + uri);
        });
        return this;
    }

    syncFiles(listing, tracked, dir) {
        const self = this;
        logger.log('info', "Syncing files...");
        if (listing.length > tracked.length) {
            /*  
                If the number of files in the directory is larger than the number
                of files in trackedFiles.json, we have documents not yet added
                to the database. We will also need to insert those files into 
                trackedFiles after finding them. For each element in listing,
                we test to see if it is in tracked. If it isn't, then we call
                the insertFile method and insert it into our database. This search 
                is costly (O(n^2)), but we can improve it later with a binary 
                search since the arrays are already sorted.
            */
            listing.forEach(file => {
                if (!(file in tracked)) {
                    self.insertFile(path.resolve(dir, file));
                }
            });
        } else if (listing.length < tracked.length) {
            /*
                If the number of files in the directory is less than the number 
                of files in trackedFiles.json, we want to remove documents from
                the database. We find each element in tracked and not in the
                directory and remove it from the database and then 
                trackedFiles.json.
            */
            tracked.forEach(file => {
                if (!(file in listing)) {
                    self.removeFile(path.resolve(dir, file));
                }
            });
        }
    }

    insertFile(file, flag) {
        const model = mongoose.model(this._models[0]);
        const self = this;
        fs.readFile(file, 'utf8', function(err, content) {
            if (err) {
                logger.log('error', "Was not able to read the file.");
            }

            let _document = JSON.parse(content);
            const schema = model.schema;
            _document["file"] = file;
            if (model) {
                if (validate(_document, schema)) {
                    model.create(_document, function(err, doc) {
                        if (err) {
                            logger.log('error', "An error occurred. " + path.basename(file) + " was not inserted into collection.");
                        }

                        logger.log('info', path.basename(file) + " was successfully inserted to collection. id: " + doc._id);
                        if (flag !== 'db') {
                            self._stack.push({ [file]: doc._id });
                            self.addToTrackedFiles();
                        }
                    });
                } else {
                    logger.log('error', "File does not have a valid schema." + " Please recheck your document.");
                }
            } else {
                logger.log('error', "Could not insert " + path.basename(file) + " into collection.");
            }
        });
    }

    updateFile(file) {
        const model = mongoose.model(this._models[0]);
        let self = this;
        fs.readFile(file, 'utf8', function(err, content) {
            if (err) {
                logger.log('error', "Was not able to update " + path.basename(file) + ".");
            }

            let updatedDoc = JSON.parse(content);
            updatedDoc["file"] = file;
            const schema = model.schema;
            if (model) {
                if (validate(updatedDoc, schema)) {
                    model.findOneAndUpdate({ file: file }, updatedDoc, { upsert: true }, (err, doc) => {
                        if (err) {
                            logger.log('error', "An error occurred. Was not" + " able to update " + path.basename(file) + ".");
                        }

                        logger.log('info', path.basename(file) + " was successfully updated.");
                    });
                } else {
                    logger.log('error', "File does not have a valid schema. Please recheck your document.");
                }
            } else {
                logger.log('error', "Could not find " + path.basename(file) + " in the tracked files.");
            }
        });
    }

    removeFile(file, flag) {
        let model = mongoose.model(this._models[0]);
        const self = this;
        if (model) {
            if (flag === 'db') {
                model.remove({ _id: file }, (err) => {
                    if (err) {
                        logger.log('error', "Was not able to remove " + path.basename(file) + " from collection.");
                    }
                    logger.log('info', "Successfully removed " + path.basename(file) + " from collection.");
                });
            } else {
                model.remove({ file: file }, (err) => {
                    if (err) {
                        logger.log('error', "Could not find document in collection.");
                    }

                    logger.log('info', "Successfully removed " + path.basename(file) + " from collection.");
                    self.removeFromTrackedFiles(file);
                });
            }
        } else {
            logger.log('error', "Could not delete " + path.basename(file) + " from collection.");
        }
    }

    addToTrackedFiles() {
        const self = this;
        /*  
            This helper function will write into trackedFiles.json a key-value
            pair of the form:
            
                file: id

            This will allow quick and easy access to finding the document in
            the database by using Obj.file as the query condition. The id can
            only be added after an insert into the database so in order to 
            remove a document from the database, the id must first exist in
            the trackedFiles.json file.
        */
        let data = fs.readFileSync(path.join(__dirname, './lib/trackedFiles.json'), 'utf8');

        if (data) {
            let trackedFilesArr = JSON.parse(data);
            trackedFilesArr.push(self._stack.pop());
            /* 
                trackedFiles.json must be opened synchronously or else we 
                have the problem of one I/O operation overwriting one 
                another. Mongoose, however, handles asynchrously operations
                perfectly so we don't have to worry about the database.
            */
            let fd = fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w+');
            fs.writeSync(fd, JSON.stringify(trackedFilesArr));
            fs.closeSync(fd);
            logger.log('info', "Successfully added " + path.basename(file) + " to tracked files.");
            logger.log('info', 'Original tracked files has been updated.');
        } else {
            // If trackedFiles.json is not empty then...
            let trackedFilesArr = [];
            trackedFilesArr.push(self._stack.pop());
            let fd = fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w+');
            fs.writeSync(fd, JSON.stringify(trackedFilesArr));
            fs.closeSync(fd);
            logger.log('info', "Successfully added " + path.basename(file) + " to tracked files.");
            logger.log('info', 'Original tracked files has been updated.');
        } 
    }

    removeFromTrackedFiles(file) {       
        let data = fs.readFileSync(path.join(__dirname, './lib/trackedFiles.json'), 'utf8');
        if (data) {
            let trackedFilesArr = JSON.parse(data);
            let filterTracked = trackedFilesArr.filter(el => Object.keys(el)[0] !== file);
            let fd = fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w+'); 
            fs.writeSync(fd, JSON.stringify(filterTracked));
            fs.closeSync(fd);
            logger.log('info', "Successfully removed " + path.basename(file) + " from tracked files.");
            logger.log('info', 'Original tracked files has been updated.');
        } else {
            logger.log('error', "trackedFiles is empty. Could not delete " + path.basename(file) + " from trackedFiles.");
        }
    }

    exit() {
        process.exit();
    }
}

/*  
    -------------------------------
        Common Helper Functions
    -------------------------------
*/

function arrayEquals(arr1, arr2) {
    if (arr1.length === 0 || arr2.length === 0) {
        return false;
    } else if (arr1.length === arr2.length) {
        for (var i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function validate(doc, schema) {
    for (let i = 0; i < Object.keys(doc).length; i++) {
        if (Object.keys(doc)[i] !== Object.keys(schema.obj)[i]) {
            return false;
        }
    }
    return true;
}

/*  
    ---------------
        Exports
    ---------------
*/

module.exports = {
    pspublisher: pspublisher,
    logger: logger
};
