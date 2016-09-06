'use strict';
var fs = require('fs'),
    chokidar = require('chokidar'),
    winston = require('winston'),
    mongoose = require('mongoose'),
    junk = require('junk'),
    path = require('path'),
    validate = require('json-schema').validate,
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

var logger = new winston.Logger({
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
        Main PSPublisher Class
    -----------------------------
*/

function PSPublisher(directory) {
    this.directory = directory;
}

PSPublisher.prototype.start = function() {
    logger.log('info', "PSPublisher is starting...");
    this.watch();
}

PSPublisher.prototype.connect = function(uri) {
    mongoose.connect(uri);

    // Confirms successful database connection
    mongoose.connection.once('connected', function(err) {
        if (err) {
            next(err);
            logger.log('error', "Couldn't connect to " + uri + ".");
        }
        logger.log('info', "Connected to " + uri);
    });
}

/*  
    ----------------------------------------------------------------------------
        Registers Schemas in order to interface with Database using Mongoose
    ----------------------------------------------------------------------------

    We opt here to have user defined models passed in as an array.

    Example:

        PSPublisher.models([{
            name: 'Posts',
            schema: {
                'title': title,
                'body': body
            }
        }]);

    Currently does not have support for subdocuments. 
*/

// This is simply to make the name of the models available to this script.
var modelNames = [];

PSPublisher.prototype.models = function(models) {
    if (!models) {
        logger.log('error', "Invalid model. Please use proper formatting" + " or a valid schema.");
    }

    if (!Array.isArray(models)) {
        logger.log('error', "Invalid model. Please use proper formatting" + " or a valid schema.");
    }

    for (var i = 0; i < models.length; i++) {
        var Schema = new mongoose.Schema(models[i].schema, { timestamps: true });
        mongoose.model(models[i].name, Schema);
        modelNames.push(models[i].name);
    }
}

/*  
    --------------------
        Main Watcher
    --------------------
*/

PSPublisher.prototype.watch = function() {
    var dir = this.directory;

    // Trim off the end of the path since chokidar have absolute directory
    // paths without a trailing backslash. This will protect users.
    if (dir[dir.length - 1] === '/') {
        dir = dir.substring(0, dir.length - 1);
    }

    // This will initialize the watcher, i.e. the main event emitter. We will
    // be calling watch() on an instance of PSPublish to use it as a wrapper
    // around chokidar with preconfigured events.
    var watcher = chokidar.watch(dir, {
        ignored: [
            /[\/\\]\./,
        ],
        persistent: true
    });

    watcher.on('ready', function() {
        logger.log('info', "Began watching " + dir);

        /* 
            Checks and sees what files are currently being watched. Chokidar also
            tracks the directory itself so it's necessary to grab the property that 
            only has the files. Our file listings is going to be our canonical record.
            Our "tracked files" in trackedFiles.json holds the id of the documents in 
            our database when they were first added. When the file is no longer in the 
            directory, we will remove the document from the database and then untrack it.
        */

        var Watched = watcher.getWatched();
        var fileListings = Watched[path.join(__dirname, dir)].sort();

        // Reconcile the file listings with the record of tracked files. This 
        // will be used to update the database on this script's startup.
        fs.readFile('./lib/trackedFiles.json', 'utf8', function(err, data) {
            if (err) {
                logger.log('error', "An error occurred with trackedFiles file." + " Please resolve before continuing.");
            }

            if (data) {
                var trackedFiles = JSON.parse(data),
                    trackedKeys = Object.keys(trackedFiles).sort();
            } else {
                var trackedKeys = [];
            }

            /*  
                trackedFiles[trackedKeys[i]] will give us the ids, if we need them.
                We can also do:
                Object.keys(trackedFiles).forEach(function (key) {
                    let value = trackedFiles[key];
                    logger.log('info', value);
                });
            */

            if (arrayEquals(fileListings, trackedKeys)) {
                logger.log('info', "Files are in sync. Will be listening for changes.");
            } else {
                if (!fileListings) {
                    logger.log('info', "There are currently no files in " + dir + ".");
                } else {
                    logger.log('info', "Files in " + dir + " are not in sync.");
                    syncFiles(fileListings, trackedKeys);
                }
            }
        });
    });

    watcher.on('add', function(file) {
        logger.log('info', file + " was added to " + dir + ".");
        insertFile(file);
    });

    watcher.on('change', function(file, stats) {
        logger.log('info', file + " was modified at " + stats.mtime + ".");
        updateFile(file);
    });

    watcher.on('unlink', function(file) {
        logger.log('info', file + " was removed from " + dir + ".");
        removeFile(file);
    });
}

/*  
    ----------------------------------
        Watcher Helper Functions
    ----------------------------------
*/

function syncFiles(listing, tracked) {
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
        listing.forEach(function(file) {
            if (!(file in tracked)) {
                insertFile(file);
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
        tracked.forEach(function(file) {
            if (!(file in listing)) {
                removeFile(file);
            }
        });
    }
}

function insertFile(file) {
    var file = file;
    fs.readFile(path.join(__dirname, file), 'utf8', function(err, content) {
        if (err) {
            logger.log('error', "Was not able to read the file.");
        }

        var model = mongoose.model(modelNames[0]);
        if (model) {
            var obj = JSON.parse(content);
            model.create(obj, function(err, doc) {
                if (err) {
                    logger.log('error', "An error occurred. " + file + " was not inserted into database.");
                }

                logger.log('info', file + " was successfully inserted. id: " + doc._id);
                addToTrackedFiles(file, doc._id);
            });
        } else {
            logger.log('error', "Could not insert " + file + " into database.");
        }
    });
}

function updateFile(file) {
    var file = file;
    fs.readFile(path.join(__dirname, file), 'utf8', function(err, content) {
        if (err) {
            logger.log('error', "Was not able to update " + file + ".");
        }

        if (!content) {
            logger.log('error', file + " cannot be empty.");
        }

        var model = mongoose.model(modelNames[0]);
        if (model) {
            var updatedDoc = JSON.parse(content);
            fs.readFile(path.join(__dirname, './lib/trackedFiles.json'), 'utf8',
                function(err, data) {
                    var fileObj = JSON.parse(data);
                    if (fileObj[file]) {
                        model.findOneAndUpdate({ _id: ObjectId(fileObj[file]) }, updatedDoc,
                            function(err, doc) {
                                if (err) {
                                    logger.log('error', "An error occurred. Was not" + " able to update " + file + ".");
                                }

                                logger.log('info', file + " was successfully updated.");
                            }
                        );
                    } else {
                        logger.log('error', "Could not find " + file + " in the tracked files.");
                    }
                }
            );
        } else {
            logger.log('error', "Was not able to update" + file + ".");
        }
    });
}

function removeFile(file) {
    var file = file;
    fs.readFile(path.join(__dirname, './lib/trackedFiles.json'), 'utf8', function(err, content) {
        if (err) {
            logger.log('error', "Was not able to read trackedFiles.json.");
        }

        var model = mongoose.model(modelNames[0]);
        if (model) {
            var fileObj = JSON.parse(content);
            model.remove({ _id: ObjectId(fileObj[file]) }, function(err) {
                if (err) {
                    logger.log('error', "Could not find document in collection.");
                }

                logger.log('info', "Successfully removed " + file + " from collection.");

                // Simply delete the key-value pair and overwrites the 
                // original file with one less element.
                delete fileObj[file];

                if (fileObj) {
                    removeFromTrackedFiles(file, fileObj);
                } else {
                    removeFromTrackedFiles(file, {});
                }
            });
        } else {
            logger.log('error', "Could not delete " + file + " from database.");
        }
    });
}

/*  
    -----------------------------
        CRUD Helper Functions
    -----------------------------
*/

function findAndValidateModel(file) {
    /*  
        This helper function will check if the file has a valid schema.
        It will return a model if it does. If not, it will throw an 
        exception. The user must create a schema before moving any files 
        into the directory.
    */
    fs.readFile(path.join(__dirname, file), 'utf8', function(err, data) {
        var obj = JSON.parse(data);
        // Validates the file. If there are no errors,
        // we can return the correct model.
        modelNames.forEach(function(name) {
            var schema = mongoose.model(name).schema;
            if ((validate(obj, schema).valid)) {
                logger.log('info', "Schema found!");
                return mongoose.model(name);
            }
        });
    });
    logger.log('error', "File does not have a valid schema." + " Please recheck your document.");
}

function addToTrackedFiles(file, id) {
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
    fs.readFile(path.join(__dirname, './lib/trackedFiles.json'), 'utf8', function(err, data) {
        // If trackedFiles.json is not empty then...
        if (data) {
            var fileObj = JSON.parse(data);
            fileObj[file] = id;

            /*
                trackedFiles.json must be opened synchronously or else we 
                have the problem of one I/O operation overwriting one 
                another. Mongoose, however, handles asynchrously operations
                perfectly so we don't have to worry about the database.
            */
            fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w', 'utf8',
                function(err, fd) {
                    if (err) {
                        logger.log('error', "There was a problem. " + file + " was not added to tracked files.");
                    }

                    var writeBuf = new Buffer(JSON.stringify(fileObj));
                    fs.writeSync(fd, writeBuf, 0, writeBuf.length, 0);
                    logger.log('info', "Successfully added " + file + " to tracked files.");
                    logger.log('info', 'Original tracked files has been updated.');

                    fs.closeSync(fd);
                }
            );
        } else {
            // else do...
            var trackObject = {};
            trackObject[file] = id;
            fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w', 'utf8',
                function(err, fd) {
                    if (err) {
                        logger.log('error', "There was a problem. " + file + " was not added to tracked files.");
                    }

                    var writeBuf = new Buffer(JSON.stringify(trackObject));
                    fs.writeSync(fd, writeBuf, 0, writeBuf.length, 0);
                    logger.log('info', "Successfully added " + file + " to tracked files.");
                    logger.log('info', 'Original tracked files has been updated.');

                    fs.closeSync(fd);
                }
            );
        }
    });
}

function removeFromTrackedFiles(file, obj) {
    fs.openSync(path.join(__dirname, './lib/trackedFiles.json'), 'w',
        function(err, fd) {
            if (err) {
                logger.log('error', "There was a problem. Could not" + " write into tracked files.");
            }

            var writeBuf = new Buffer(JSON.stringify(obj));
            fs.writeSync(fd, writeBuf, 0, writeBuf.length, 0);
            logger.log('info', "Successfully removed " + file + " from tracked files.");
            logger.log('info', 'Original tracked files has been updated.');

            fs.closeSync(fd);
        }
    );
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

/*  
    ---------------
        Exports
    ---------------
*/

module.exports = { 
    PSPublisher: PSPublisher,
    logger: logger
};
