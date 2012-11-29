//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var child_process = require('child_process');
var fs = require('fs');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var RegistryBuilderChild = function() {};

RegistryBuilderChild.prototype.start = function() {
    process.on('message', function(m) {
        if (m.sourceFile) {
            require(m.sourceFile);
        } else {
            throw new Error("RegistryBuilderChild received message that did not have a source file");
        }
    });
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = RegistryBuilderChild;
