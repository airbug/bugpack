/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('./BugPackFix').fix(module, "./BugPackApi", function(module) {

    //-------------------------------------------------------------------------------
    // Requires
    //-------------------------------------------------------------------------------

    var BugPackContext  = require('./BugPackContext');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     */
    var BugPackApi = function() {};


    //-------------------------------------------------------------------------------
    // Static Properties
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @type {BugPackContext}
     */
    BugPackApi.currentContext               = null;

    /**
     * @private
     * @type {Object}
     */
    BugPackApi.contextUrlToBugPackContext   = {};


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
     * @static
     * @param {string} contextQuery
     * @param {function(BugPackContext)=} contextFunction
     * @return {BugPackContext}
     */
    BugPackApi.context = function(contextQuery, contextFunction) {
        if (contextQuery && contextQuery !== "*") {
            var foundContext = BugPackApi.getContext(contextQuery);
            if (foundContext) {
                BugPackApi.setCurrentContext(foundContext);
            } else {
                throw new Error("No context loaded for '" + contextQuery + "'");
            }
        } else if (!BugPackApi.currentContext) {
            BugPackApi.setCurrentContext(BugPackApi.generateContext("*"));
        }
        if (contextFunction) {
            contextFunction(BugPackApi.currentContext);
        }
        return BugPackApi.currentContext;
    };

    /**
     * @static
     * @param {string} contextUrl
     * @param {function(Error, BugPackContext=)} callback
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
     * @static
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
     * @static
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
     * @static
     * @private
     * @param {string} contextUrl
     * @return {boolean}
     */
    BugPackApi.hasContext = function(contextUrl) {
        return Object.prototype.hasOwnProperty.call(BugPackApi.contextUrlToBugPackContext, contextUrl);
    };

    /**
     * @static
     * @private
     * @param {string} contextUrl
     * @param {BugPackContext} context
     */
    BugPackApi.putContext = function(contextUrl, context) {
        BugPackApi.contextUrlToBugPackContext[contextUrl] = context;
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    module.exports = BugPackApi;

    //TODO BRN: This is pretty hacky. Fix this...

    require.modules["bugpack"] = BugPackApi;
});
