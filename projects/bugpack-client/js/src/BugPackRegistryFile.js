//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryFile = function(registryFilePath) {

    /**
     * @private
     * @type {string}
     */
    this.registryFilePath = registryFilePath;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackRegistryFile.prototype.getRegistryPath = function() {
    return this.registryFilePath.replace("/bugpack-registry.json", "");
};

/**
 * @param {function(Error, Object=)} callback
 */
BugPackRegistryFile.prototype.loadRegistryContents = function(callback) {
    var request = this.createXMLHttpRequest();
    var requestTimer = setTimeout(function() {
        request.abort();
        //TODO BRN: Add a retry mechanism;
        //TODO BRN: What does abort do to the request state change handler?
        console.log("Request timeout!");
        callback(new Error("Request timed out. Could not find bugpack-registry.json file!"));
    }, 30000);
    request.onreadystatechange = function() {
        if (request.readyState != 4)  { return; }
        clearTimeout(requestTimer);
        if (request.status === 200)  {
            var serverResponse = JSON.parse(request.responseText);
            callback(null, serverResponse);
        } else {
            callback(new Error("Could not find bugpack-registry.json file!"));
        }
    };
    request.open('GET', this.registryFilePath, true);
    request.send(null);
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

BugPackRegistryFile.prototype.createXMLHttpRequest = function() {
    try {
        return new XMLHttpRequest();
    } catch(e) {

    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {

    }
    throw new Error("XMLHttpRequest not supported");
};

