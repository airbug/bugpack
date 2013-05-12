//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var child_process = require('child_process');
var fs = require('fs');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var RegistryBuilderChild = function() {};


//-------------------------------------------------------------------------------
// Public Class Methods
//-------------------------------------------------------------------------------

RegistryBuilderChild.prototype.start = function() {
    var _this = this;
    process.on('message', function(message) {
        _this.handleMessage(message);
    });
};

RegistryBuilderChild.prototype.error = function(message) {
    process.send({
        error: true,
        message: message
    });
};


//-------------------------------------------------------------------------------
// Private Class Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {string} argumentsString
 * @return {Array.<(string|number)>}
 */
RegistryBuilderChild.prototype.parseArguments = function(argumentsString) {
    var args = [];
    var parts = argumentsString.split(',');
    parts.forEach(function(part) {
        var results = part.match(/\s*('|")(.*?)\1\s*/);
        if (results) {
            args.push(results[2]);
        } else {
            var num = parseFloat(part);
            if (isNaN(num)) {
                throw new Error("Could not parse parameter '" + part + "'");
            }
            args.push(num);
        }
    });
    return args;
};

/**
 * @private
 * @param {string} sourceFile
 */
RegistryBuilderChild.prototype.processSourceFile = function(sourceFile) {
    var _this = this;
    fs.readFile(sourceFile, 'utf8', function(error, data) {
        if (error) {
            throw new Error(error);
        }
        try {
            var annotations = [];
            var lines = data.split('\n');
            lines.forEach(function(line) {
                var results = line.match(/\s*\/\/\s*@([a-zA-Z][0-9a-zA-Z]*)(?:\((.+)?\))?\s*/);
                if (results) {
                    var annotation = {
                        name: results[1]
                    };
                    var argumentsString = results[2];
                    if (argumentsString !== undefined) {
                        annotation.arguments = _this.parseArguments(argumentsString);
                    }
                    annotations.push(annotation);
                }
            });
        } catch(error) {
            error.message += " while processing file '" + sourceFile + "'";
            throw error;
        }
        process.send({
            sourceFile: sourceFile,
            annotations: annotations
        });
    });
};


//-------------------------------------------------------------------------------
// Message Handlers
//-------------------------------------------------------------------------------

RegistryBuilderChild.prototype.handleMessage = function(message) {
    if (message.sourceFile) {
        try {
            this.processSourceFile(message.sourceFile);
        } catch(e) {
            this.error(e.message);
        }
    } else {
        this.error("RegistryBuilderChild received message that did not have a source file");
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = RegistryBuilderChild;
