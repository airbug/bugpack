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
        var foundContext = BugPackApi.getContext(contextUrl);
        if (foundContext) {
            BugPackApi.currentContext = foundContext;
        } else {
            throw new Error("No context loaded for '" + contextUrl + "'");
        }
    } else if (!BugPackApi.currentContext) {
        BugPackApi.currentContext = BugPackApi.generateContext("*");
    }
    return BugPackApi.currentContext;
};

/**
 * @param {string} contextUrl
 * @param {function(Error, BugPackContext)}
 */
BugPackApi.loadContext = function(contextUrl, callback) {
    if (!BugPackApi.hasContext(contextUrl)) {

        //TODO BRN: This check is temporary until we can figure out how to support multiple contexts on the client side
        if (BugPackApi.currentContext) {
            callback(new Error("Can only support loading of one context for the time being"));
        }

        var context = BugPackApi.generateContext(contextUrl);
        context.loadContext(function(error) {
            if (!error) {
                callback(null, context);
            } else {
                callback(error);
            }
        });
    } else {
        callback(null, BugPackApi.getContext(contextUrl));
    }
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {string} contextUrl
 * @return {BugPackContext}
 */
BugPackApi.generateContext = function(contextUrl) {
    var context = BugPackApi.getContext(contextUrl);
    if (!context) {
        context = new BugPackContext(contextUrl, BugPackApi);
        BugPackApi.putContext(contextUrl, context);
    }
    return context;
};

/**
 * @private
 * @param {string} contextUrl
 * @return {BugPackContext}
 */
BugPackApi.getContext = function(contextUrl) {
    if (BugPackApi.hasContext(contextUrl)) {
        return BugPackApi.contextUrlToBugPackContext[contextUrl];
    }
    return null;
};

/**
 * @private
 * @param {string} contextUrl
 * @return {boolean}
 */
BugPackApi.hasContext = function(contextUrl) {
    return Object.prototype.hasOwnProperty.call(BugPackApi.contextUrlToBugPackContext, contextUrl);
};

/**
 * @private
 * @param {string} contextUrl
 * @param {BugPackContext} context
 */
BugPackApi.putContext = function(contextUrl, context) {
    BugPackApi.contextUrlToBugPackContext[contextUrl] = context;
};

var oldRequire = require || undefined;
var require = function(requireName) {
    if (requireName === "bugpack") {
        return BugPackApi;
    } else if (oldRequire !== undefined) {
        return oldRequire(requireName);
    } else {
        throw new Error("unknown require name '" + requireName + "'");
    }
};
