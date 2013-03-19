//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackApi = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

/**
 * @private
 * @type {BugPackContext}
 */
BugPackApi.currentContext = null;

/**
 * @private
 * @type {Object}
 */
BugPackApi.contextUrlToBugPackContext = {};


//-------------------------------------------------------------------------------
// Static Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @param {BugPackContext} context
 */
BugPackApi.setCurrentContext = function(context) {
    BugPackApi.currentContext = context;
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} contextUrl
 * @return {BugPackContext}
 */
BugPackApi.context = function(contextUrl) {
    if (contextUrl) {
        BugPackApi.currentContext = BugPackApi.generateContext(contextUrl);
    } if (!BugPackApi.currentContext) {
        BugPackApi.currentContext = BugPackApi.generateContext("*");
    }

    return BugPackApi.currentContext;
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} contextUrl
 * @return {BugPackContext}
 */
BugPackApi.generateContext = function(contextUrl) {
    var context = BugPackApi.getContextForContextUrl(contextUrl);
    if (!context) {
        context = new BugPackContext(contextUrl, this);
        context.generate();
        BugPackApi.putContextForContextUrl(contextUrl, context);
    }
    return context;
};

/**
 * @private
 * @param {string} contextUrl
 * @return {BugPackContext}
 */
BugPackApi.getContextForContextUrl = function(contextUrl) {
    if (BugPackApi.hasContextForContextUrl(contextUrl)) {
        return BugPackApi.contextUrlToBugPackContext[contextUrl];
    }
    return null;
};

/**
 * @private
 * @param {string} contextUrl
 * @return {boolean}
 */
BugPackApi.hasContextForContextUrl  = function(contextUrl) {
    return Object.prototype.hasOwnProperty.call(BugPackApi.contextUrlToBugPackContext, contextUrl);
};

/**
 * @private
 * @param {string} contextUrl
 * @param {BugPackContext} context
 */
BugPackApi.putContextForContextUrl = function(contextUrl, context) {
    BugPackApi.contextUrlToBugPackContext[contextUrl] = context;
};

var oldRequire = require || undefined;
var require = function(requireName) {
    if (requireName === "bugpack") {
        return BugPackApi;
    } else if (oldRequire !== undefined) {
        oldRequire(requireName);
    } else {
        throw new Error("unknown require name '" + requireName + "'");
    }
};
