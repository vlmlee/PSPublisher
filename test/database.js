'use strict';

var assert = require('assert').
	mocha = require('mocha'),
	mongo = require('mongodb');

/* checks that database connection is successful
*/

/* checks if after creating two files in the working directory if the files are inserted into the database.
*/

/* checks if after creating two files and moving it into the working directory if the files are inserted into the database
*/

/* deletes the first file inserted and checks and see if there are three documents in the database */

/* checks the records in the trackedFiles json file and make sure there are three records
*/

/* after stopping the script, remove the last two files and reruns the script. Checks and see if there is only one document in the database.
*/

/* check the records in the trackedFiles json file and make sure there is only one record
*/

/* after stopping the script, adds two files into the working directory and reruns the script. Checks and see if there are now three documents in the database.
*/

/* checks the trackFiles json file and make sure there are now three records

/* delete all documents from the database and check to see that there are no records in the trackedFiles json file.
*/
