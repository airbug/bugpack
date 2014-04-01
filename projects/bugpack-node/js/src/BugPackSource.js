//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs      = require('fs');
var path    = require('path');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

/**
 * @constructor
 * @param {string} sourceFilePath
 */
var BugPackSource = function(sourceFilePath) {

    /**
     * @private
     * @type boolean}
     */
    this.loaded         = false;


    /**
     * @private
     * @type {Array}
     */
    this.loadCallbacks  = [];

    /**
     * @private
     * @type {boolean}
     */
    this.loadStarted    = false;

    /**
     * @private
     * @type {string}
     */
    this.sourceFilePath = sourceFilePath;
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackSource.prototype.getSourceFilePath = function() {
    return this.sourceFilePath;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {function(Error=)} callback
 */
BugPackSource.prototype.addLoadCallback = function(callback) {
    this.loadCallbacks.push(callback);
};

/**
 * @return {boolean}
 */
BugPackSource.prototype.hasLoaded = function() {
    return this.loaded;
};

/**
 * @return {boolean}
 */
BugPackSource.prototype.hasLoadStarted = function() {
    return this.loadStarted;
};

/**
 *
 */
BugPackSource.prototype.loadSync = function() {
    if (!this.loaded) {
        this.loaded = true;
        this.loadSourceSync();
    }
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {Error=} error
 */
BugPackSource.prototype.loadComplete = function(error) {
    this.loaded = true;
    this.loadCallbacks.forEach(function(loadCallback) {
        loadCallback(error);
    });
    this.loadCallbacks = [];
};

/**
 * @private
 */
BugPackSource.prototype.loadSource = function() {
    var error = undefined;
    try {
        require(this.sourceFilePath);
    } catch(e) {
        error = e;
    }
    this.loadComplete(error);
};

/**
 * @private
 */
BugPackSource.prototype.loadSourceSync = function() {
    var error = undefined;
    try {
        require(this.sourceFilePath);
    } catch(e) {
        error = e;
    }
    this.loadComplete(error);
    if (error) {
        throw error;
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackSource;
