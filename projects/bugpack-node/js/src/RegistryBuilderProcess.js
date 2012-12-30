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

RegistryBuilderChild.prototype.handleMessage = function(message) {
    var _this = this;
    if (message.sourceFile) {
        fs.readFile(message.sourceFile, 'utf8', function(error, data) {
            if (error) {
                _this.error(error);
            }

            var reply = {
                packName: "",
                sourceFile: message.sourceFile,
                options: {
                    autoload: false
                }
            };
            var lines = data.split('\n');
            lines.forEach(function(line) {
                var exportMatches = data.match(/\s*\/\/@Export\(('|")(.*?)\1\)/);
                if (exportMatches) {
                    reply.packName = exportMatches[2];
                }
                var autoloadMatches = data.match(/\s*\/\/@Autoload/);
                if (autoloadMatches) {
                    reply.options.autoload = true;
                }
            });

            process.send(reply);
        });
    } else {
        this.error("RegistryBuilderChild received message that did not have a source file");
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = RegistryBuilderChild;
