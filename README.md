# bugpack

bugpack is a JavaScript package loader that helps make browser and node js package
loading consistent. It is designed to work both within node js as well as directly
in the browser.

bugpack provides a simple name base package loading mechanism that depends upon a
pre-generated registry called bugpack-registry.json. These files can be
produced using the [bugpack-registry](https://github.com/airbug/bugpack-registry)
project. Name based loading makes it very simple to export and require packages
without having to update all of your requires every time you move a file.

The library makes up part of the foundation of our architecture for [airbug](http://airbug.com)
so check out the docs for an overview of the full power of what the code has
to offer. If the library is missing something you need, please let us know!

Latest Version `0.1.13`

NOTE: This documentation is still being written. If you click on a link and it
doesn't go anywhere, it's likely because that portion of the docs hasn't been
written yet. If there are parts of the docs you'd like us to focus on, feel
free to ask!


## Quick Examples

Export and require without loading of registry
```javascript
var bugpack     = require('bugpack');

var MyExport = function() {};

bugpack.export('MyExportName', MyExport);


// Else where in code...
var MyExport = bugpack.require('MyExportName');    // MyExport
```


## Download Source

The source is available for download from [GitHub](https://github.com/airbug/bugpack)

For the web, you can download the packaged scripts here

    https://s3.amazonaws.com/public-airbug/bugpack-0.1.13.js
    https://s3.amazonaws.com/public-airbug/bugpack-0.1.13.min.js


## Install

For node js, you can install using Node Package Manager [npm](https://www.npmjs.org/package/bugpack)

    npm install bugpack

For the web, simply include this script in your application

```html
<script type="text/javascript" src="https://s3.amazonaws.com/public-airbug/bugpack-0.1.13.min.js"></script>
```


## Usage

In node js:

```javascript
var bugpack = require('bugpack');

var SomePackage = bugpack.require('SomePackage');
```

In the browser:

```html
<script type="text/javascript" src="https://s3.amazonaws.com/public-airbug/bugpack-0.1.13.js"></script>
<script type="text/javascript">

var bugpack = require('bugpack');

var SomePackage = bugpack.require('SomePackage');

</script>
```


## Documentation

### Overview

* [`Getting Started`](#GettingStarted)

### BugPack Registry

* [`Creating Registry`](#CreatingRegistry)
* [`Where to Put Registry`](#WhereToPutRegistry)
* [`Loading Registry`](#LoadingRegistry)

### BugPack System
* [`BugPackApi`](#BugPackApi)
* [`BugPackContext`](#BugPackContext)


<br /><a name="GettingStarted" />
## Getting Started

__Generate bugpack-registry.json file__

bugpack-registry.json files are what tell the bugpack system the names of all the available exports
and where they can be found. Registry files should generated and placed at the root of either a node
module (for node js) or a base url (for the web). Registry files use relative paths to point the bugpack
system at files. So once the registry file is generated it should stay at the same relative point as
the files that the registry points to...


__Example__

I have JS files that have bugpack annotations located at...
```
/my/path/myfile.js
/my/path/somedir/myotherfile.js
```

I decide to generate my registry at
```
/my/path
```

So that the registry now lives at..
```
/my/path/bugpack-registry.json
```

As long as the registry file and the JS files remain relative to one another the system will work.

e.g.
I can move all the contents of `/my/path/` to `/my/elsewhere/`

So the files are now
```
/my/elsewhere/myfile.js
/my/elsewhere/somedir/myotherfile.js
/my/elsewhere/bugpack-registry.json
```

The registry file is still in the same relative path to the JS files, so it will work..

However, you could not just move the contents of `/my/path/somedir/` to `/my/path/someotherdir/`

So the files are now
```
/my/path/myfile.js
/my/path/someotherdir/myotherfile.js
/my/path/bugpack-registry.json
```

This would prevent the bugpack system from correctly knowing where the myotherfile.js is located.

When these breaking changes are made, you will need to regenerate the bugpack-registry.json file
