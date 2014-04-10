//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackSource = function(sourceFilePath) {

    /**
     * @private
     * @type boolean}
     */
    this.loaded = false;

    /**
     * @private
     * @type {Array}
     */
    this.loadCallbacks = [];

    /**
     * @private
     * @type {boolean}
     */
    this.loadStarted = false;

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
BugPackSource.prototype.load = function() {
    if (!this.loaded && !this.loadStarted) {
        this.loadStarted = true;
        this.loadSource();
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
    //TODO BRN: Test this in IE and other browsers.
    var _this = this;
    var scripts = document.getElementsByTagName("script");
    var lastScript = scripts[scripts.length - 1];
    var scriptLoader = document.createElement("script");
    scriptLoader.type = "text/javascript";
    scriptLoader.async = true;
    scriptLoader.src = this.sourceFilePath;
    scriptLoader.onload = function(event) {
        _this.loadComplete();
    };
    scriptLoader.onerror = function(event) {
        _this.loadComplete(new Error("script loading failed."));
    };
    lastScript.parentNode.insertBefore(scriptLoader, lastScript.nextSibling);
};
