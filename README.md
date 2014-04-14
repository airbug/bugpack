# bugpack

bugpack is a JavaScript class and package loader that helps make browser and
node js package loading consistent. It is designed to work both within node
js as well as directly in the browser.

bugpack provides a simple package loading mechanism that depends upon a
pre-generated registry called bugpack-registry.json. These files can be
produced using the [bugpack-registry](https://github.com/airbug/bugpack-registry) project.

The library makes up part of the foundation of our architecture for [airbug](http://airbug.com)
so check out the docs for an overview of the full power of what the code has
to offer. If the library is missing something you need, please let us know!

Latest Version `0.1.11`


## Quick Examples

Export and require without loading of registry
```javascript
var bugpack     = require('bugpack');

var MyExport = function() {};

bugpack.export('MyExportName', MyExport);


// Else where in code...
var MyExport = bugpack.require('MyExportName');    // MyExport
```

## Download

The source is available for download from [GitHub](https://github.com/airbug/bugpack)

For node js, you can install using Node Package Manager [npm](https://www.npmjs.org/package/bugpack)

    npm install bugpack

For the web, you can access the scripts here

    https://s3.amazonaws.com/public-airbug/bugpack-0.1.11.js
    https://s3.amazonaws.com/public-airbug/bugpack-0.1.11.min.js


## Usage

In node js:

```javascript
var bugpack = require('bugpack');

var SomePackage = bugpack.require('SomePackage');
```

In the browser:

```html
<script type="text/javascript" src="https://s3.amazonaws.com/public-airbug/bugpack-0.1.11.js"></script>
<script type="text/javascript">

var bugpack = require('bugpack');

var SomePackage = bugpack.require('SomePackage');

</script>
```
