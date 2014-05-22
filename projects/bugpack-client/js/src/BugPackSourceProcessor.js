/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

/**
 * @constructor
 * @param {BugPackSource} bugPackSource
 * @param {BugPackContext} bugPackContext
 */
var BugPackSourceProcessor = function(bugPackSource, bugPackContext) {

    /**
     * @private
     * @type {BugPackSource}
     */
    this.bugPackSource      = bugPackSource;

    /**
     * @private
     * @type {BugPackContext}
     */
    this.bugPackContext     = bugPackContext;

    /**
     * @private
     * @type boolean}
     */
    this.processed          = false;

    /**
     * @private
     * @type {Array}
     */
    this.processedCallbacks = [];

    /**
     * @private
     * @type {boolean}
     */
    this.processingStarted = false;
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {BugPackSource}
 */
BugPackSourceProcessor.prototype.getBugPackSource = function() {
    return this.bugPackSource;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {function(Error=)} callback
 */
BugPackSourceProcessor.prototype.addProcessedCallback = function(callback) {
    this.processedCallbacks.push(callback);
};

/**
 * @return {boolean}
 */
BugPackSourceProcessor.prototype.hasProcessed = function() {
    return this.processed;
};

/**
 * @return {boolean}
 */
BugPackSourceProcessor.prototype.hasProcessingStarted = function() {
    return this.processingStarted;
};

/**
 *
 */
BugPackSourceProcessor.prototype.process = function() {
    if (!this.processed && !this.processingStarted) {
        this.processingStarted = true;
        this.processSource();
    }
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

//TODO BRN: This class is super tightly coupled with BugPackContext and really ugly. Figure out how to cleanly break this apart.

/**
 * @private
 */
BugPackSourceProcessor.prototype.loadBugPackSource = function() {
    var _this = this;
    if (!this.bugPackSource.hasLoaded()) {
        this.bugPackSource.addLoadCallback(function(error) {
            _this.processingComplete(error);
        });
        if (!this.bugPackSource.hasLoadStarted()) {
            this.bugPackContext.getBugPackApi().setCurrentContext(this.bugPackContext);
            this.bugPackSource.load();
        }
    } else {
        this.processingComplete();
    }
};

/**
 * @private
 * @param {Error=} error
 */
BugPackSourceProcessor.prototype.processingComplete = function(error) {
    if (!this.processed) {
        this.processed = true;
        this.processedCallbacks.forEach(function (processedCallback) {
            processedCallback(error);
        });
        this.processedCallbacks = [];
    }
};

/**
 * @private
 */
BugPackSourceProcessor.prototype.processSource = function() {
    var _this               = this;
    var registryEntry       = this.bugPackContext.getRegistry().getEntryBySourceFilePath(this.bugPackSource.getSourceFilePath());
    var requiredExports     = registryEntry.getRequires();
    if (requiredExports.length > 0) {
        var loadedExportsCount = 0;
        requiredExports.forEach(function(requiredExport) {
            _this.bugPackContext.processExport(requiredExport, function(error) {
                if (!error) {
                    loadedExportsCount++;
                    if (loadedExportsCount === requiredExports.length) {
                        _this.loadBugPackSource();
                    }
                } else {
                    _this.processingComplete(error);
                }
            });
        });
    } else {
        this.loadBugPackSource();
    }
};
