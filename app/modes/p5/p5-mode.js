var wrench = nodeRequire('wrench');
var Path = nodeRequire('path');
var os = nodeRequire('os');
var fs = nodeRequire('fs');
var request = nodeRequire('request');
var Files = require('../../files');

// packages needed for parsing.
var _ = require('underscore'),
    esprima = require('esprima'),
    escodegen = require('escodegen');

var liveCodingEnabled = true;
//global objects tracked for live coding
var globalObjs = {};

var canvasWidth;
var canvasHeight;
var prevCanvasWidth;
var prevCanvasHeight;

module.exports = {
  newProject: function() {
    //copy the empty project folder to a temporary directory
    var emptyProject = Path.join('mode_assets', 'p5', 'empty_project');
    var tempProject = Path.join(os.tmpdir(), 'p5' + Date.now(), 'Untitled');
    wrench.mkdirSyncRecursive(tempProject);
    wrench.copyDirSyncRecursive(emptyProject, tempProject, {
      excludeHiddenUnix: true,
      inflateSymlinks: true,
      forceDelete: true
    });

    this.projectPath = tempProject;

    //open the project and file
    var self = this;
    this.loadProject(tempProject, function(){
      self.openFile(Path.join(tempProject, 'sketch.js'));
      gui.Window.get().show();
    });

  },


  launchExample: function(examplePath) {
    //copy the empty project folder to a temporary directory
    var emptyProject = 'mode_assets/p5/empty_project';
    var tempProjectPath = Path.join(os.tmpdir(), 'p5' + Date.now(), Files.cleanExampleName(examplePath));
    wrench.mkdirSyncRecursive(tempProjectPath);
    wrench.copyDirSyncRecursive(emptyProject, tempProjectPath, {
      excludeHiddenUnix: true,
      inflateSymlinks: true,
      forceDelete: true
    });
    // replace contents of sketch.js with the requested example
    var sketchContents = fs.readFileSync(examplePath, {encoding: 'utf8'});
    var assets = sketchContents.match(/['"]assets\/(.*?)['"]/g);
    if (assets) {
      var assetsDir = Path.join(tempProjectPath, 'assets');
      wrench.mkdirSyncRecursive(assetsDir);
      assets.forEach(function(a){
        a = a.replace(/(assets\/)|['"]/g, '');
        var originalAsset = Path.join('mode_assets/p5/example_assets', a);
        var destAsset = Path.join(assetsDir, a);
        fs.createReadStream(originalAsset).pipe(fs.createWriteStream(destAsset));
      });
    }
    var destination = Path.join(tempProjectPath, "sketch.js");
    fs.writeFileSync(destination, sketchContents);
    this.openProject(tempProjectPath, true);
  },

  exportProject: function() {
    console.log('hello');
  },

  saveAs: function(path) {
    if (!path) return false;

    if (path.indexOf(this.projectPath) > -1) {
      alert("Unable to save project inside another project");
      return false;
    }
    //save all files
    this.saveAll();

    //copy the folder
    wrench.copyDirSyncRecursive(this.projectPath, path);

    //change file paths
    this.files.forEach(function(file) {
      file.path = Path.join(path, file.name);
    });
    this.tabs.forEach(function(tab){
      tab.path = Path.join(path, tab.name);
    });

    this.$broadcast('save-project-as', path);

    // change the html title tag
    var indexPath = Path.join(path, 'index.html');
    var projectTitle = Path.basename(path);
    var oldProjectTitle = Path.basename(this.projectPath);

    fs.readFile(indexPath, 'utf8', function(err, data){
      if (!err) {
        data = data.replace('<title>' + oldProjectTitle + '</title>', '<title>' + projectTitle + '</title>');
        fs.writeFile(indexPath, data);
      }
    });

    this.projectPath = path;
    this.temp = false;
    this.watch(path);
  },

  run: function() {
    var self = this;
    this.saveAll();
    gui.App.clearCache();

    if (this.outputWindow) {
      if (this.settings.runInBrowser) {
        gui.Shell.openExternal(url);
      } else {
        this.outputWindow.reloadIgnoringCache();
        if(isWin){
          self.outputWindow.hide();
          self.outputWindow.show();
        }
      }
    } else {
      startServer(this.projectPath, this, function(url) {
        if (self.settings.runInBrowser) {
          gui.Shell.openExternal(url);
        } else {
          fs.readFile(Path.join(self.projectPath, 'sketch.js'), function(err, data){
            var matches = (""+data).match(/createCanvas\((.*),(.*)\)/);
            canvasWidth = matches && matches[1] ? +matches[1] : 400;
            canvasHeight = matches && matches[2] ? +matches[2] : 400;

            if (!self.outW) self.outW = canvasWidth;
            if (!self.outH) self.outH = canvasHeight;

            if ((canvasWidth != prevCanvasWidth || canvasHeight != prevCanvasHeight) && !self.resizedOutputWindow) {
              self.outW = canvasWidth;
              self.outH = canvasHeight;
            }

            self.outputWindow = self.newWindow(url, {
              toolbar: true,
              'inject-js-start': 'js/debug-console.js',
              x: self.outX,
              y: self.outY,
              width: self.outW,
              height: self.outH,
              nodejs: false,
              'page-cache': false,
            });

            prevCanvasWidth = canvasWidth;
            prevCanvasHeight = canvasHeight;

            self.outputWindow.on('document-start', function(){

              //call codeChanged to get the globalObjs initialized. for the first time it doen't emit any change.
              var content = self.currentFile.contents;
              //TODO get the file by name to make sure sketch.js gets parsed.
              self.modeFunction('codeChanged', content);

              self.outputWindow.show();
            });

            self.outputWindow.on("close", function(){
              self.outX = self.outputWindow.x;
              self.outY = self.outputWindow.y;
              self.outW = self.outputWindow.width;

              // the "-55" appears to fix the growing window issue,
              // & resulting gasslighting of myself
              self.outH = self.outputWindow.height - 55;
              self.running = false;
              self.outputWindow = null;
              this.close(true);
            });

            self.outputWindow.on('focus', function(){
              self.resetMenu();
            });

            self.outputWindow.on('resize', function() {
              self.resizedOutputWindow = true;
            });
          });
        }
        self.running = true;
      });
    }
  },

  stop: function() {
    // if (nodeGlobal.serialRunning) {
    //   p5serial.stop();
    //   nodeGlobal.serialRunning = false;
    // }
    if (this.outputWindow) {
      this.outputWindow.close();
    } else {
      this.running = false;
    }
  },

  update: function(callback) {
    var url = 'https://api.github.com/repos/processing/p5.js/releases/latest';
    var libraryPath = Path.join('mode_assets', 'p5', 'empty_project', 'libraries');
    var fileNames = ['p5.js', 'p5.dom.js', 'p5.sound.js'];

    request({url: url, headers: {'User-Agent': 'request'}}, function(error, response, data){
      if (error) return;

      // filter assets to only include the filenames we want
      var assets = JSON.parse(data).assets.filter(function(asset){
        return fileNames.indexOf(asset.name) > -1;
      });

      // if remoteVersion != localVersion, download new version of each asset
      var remoteVersion = JSON.parse(data).tag_name;
      var localPathToP5 = Path.join(libraryPath, 'p5.js');

      var localVersionTag = getVersion(localPathToP5, function(localVersion) {
        if (remoteVersion != localVersion || !localVersion) {
          assets.forEach(function(asset) {
            var localPathToAsset = Path.join(libraryPath, asset.name);
            downloadAsset(asset.browser_download_url, localPathToAsset);
          });
        }
      });

    });

    function downloadAsset(remote, local) {
      request({url: remote, headers: {'User-Agent': 'request'}}, function(error, response, body){
        if (error) return;

        if (body.split('\n')[0].indexOf('/*! p5.') > -1) {
          fs.writeFile(local, body);
        }
      });
    }
  },

  addLibrary: function(path) {
    var basename = Path.basename(path);
    var src = Path.join('mode_assets', 'p5', 'libraries', basename);
    var dest = Path.join(this.projectPath, 'libraries', basename);
    fs.createReadStream(src).pipe(fs.createWriteStream(dest));

    var indexPath = Path.join(this.projectPath, 'index.html');
    fs.readFile(indexPath, 'utf8', function(err, data){
      var scriptTag = '<script src="libraries/'+basename+'" type="text/javascript"></script>';
      var p5tag = '<script src="libraries/p5.js" type="text/javascript"></script>';

      if (data.indexOf(scriptTag) < 0) {
        var newHtml = data.replace(p5tag, p5tag + '\n    ' + scriptTag);
        fs.writeFile(indexPath, newHtml);
      }
    });
  },



  codeChanged: function(codeContent) {
    //if live coding enabled //TODO how to check if the sketch is running?
    if(liveCodingEnabled) {


      try {
        //TODO is there any way of doing a shallow parse since we just need global stuff (most likely not)
        var syntax = esprima.parse(codeContent);

      }
      catch(e) {
        return;
      }

        //TODO tranversing syntax tree instead of if/else checks?
        _.each(syntax.body, function(i) {

            if (i.type === 'FunctionDeclaration') {
              // Global functions: 


              //TODO: is there a better way of getting the content of the function than unparsing it?

              var name = i.id.name;
              var value = escodegen.generate(i.body).replace('\n','');

              var params = i.params.map(function(item) {
                return item.name;
              });
              
              checkForChangeAndEmit(name, 'function', value, params);

            }
            else if (i.type ==='ExpressionStatement' &&
                     i.expression.left && i.expression.left.type === 'MemberExpression' &&
                     i.expression.right && i.expression.right.type === 'FunctionExpression') {
              // functions declared as expression e.g Obj.prototype.foo = function() {}

              var name = escodegen.generate(i.expression.left);
              var value = escodegen.generate(i.expression.right.body).replace('\n','');

              if(i.expression.right && i.expression.right.params) {
                var params = i.expression.right.params.map(function(item) {
                  return item.name;
                });
              }
              
              checkForChangeAndEmit(name, 'function', value, params);

              
            }
            else if (i.type === 'VariableDeclaration') {
              // Global variables: 

              var name = i.declarations[0].id.name;
              var value = i.declarations[0].init ? escodegen.generate(i.declarations[0].init) : null;

              // client should know if the value is number to parseFloat string that is received.
              var isNumber = i.declarations[0].init  && //it is initialized and ... 
                            ((i.declarations[0].init.type==='Literal' 
                                && typeof i.declarations[0].init.value === 'number')  //for numbers
                            || (i.declarations[0].init.type==='UnaryExpression' 
                                && typeof i.declarations[0].init.argument.value === 'number')); //for negative numbers
                            //TODO what else? is there any other type of parse tree for numbers?
              
              var type = isNumber ? 'number' : 'variable';

              if(i.declarations[0].init  && i.declarations[0].init.type==="ObjectExpression") {
                //pass object type since it needs to be parsed on client
                type = 'object';
              }


              checkForChangeAndEmit(name, type, value);


            }
        });
      
    }
          


  },

  referenceURL: 'http://p5js.org/reference/'

};

function checkForChangeAndEmit(name, type, value, params) {

    //console.log('checking ',name, value, params);

    //if object doesn't exist or has been changed, update and emit change.
    if(!globalObjs[name]) {
      globalObjs[name] = {name: name, type: type, value: value, params: params};
    }
    else if( globalObjs[name].value !== value) {
      globalObjs[name] = {name: name, type: type, value: value, params: params};
      //io.emit('codechange', globalObjs[name]);
      console.log('POST MESSAGE for', name, value);
      window.opener.postMessage(JSON.stringify({ objectChanged: globalObjs[name] }),'*');
    }

}
var running = false;
var url = '';
var staticServer = nodeRequire('node-static'), server, file;

// var p5serial = nodeRequire('p5.serialserver');

function startServer(path, app, callback) {
  if (running === false) {
    // if (!nodeGlobal.serialRunning) {
    //   p5serial.start();
    //   nodeGlobal.serialRunning = true;
    // }
    var portscanner = nodeRequire('portscanner');
    portscanner.findAPortNotInUse(3000, 4000, '127.0.0.1', function(error, port) {
      server = nodeRequire('http').createServer(handler);
      file = new staticServer.Server(path, {cache: false});

      server.listen(port, function(){
        url = 'http://localhost:' + port;
        callback(url);
        running = true;
      });

      function handler(request, response) {
        request.addListener('end', function () {
          file.serve(request, response);
        }).resume();
      }
    });


  } else {
    file = new staticServer.Server(path, {cache: false});
    callback(url);
  }

}

function getVersion(filename, callback) {
  fs.readFile(filename, function (err, data) {
    if (err) throw err;

    var line = data.toString('utf-8').split("\n")[0];
    var version;
    try {
      version = line.match(/v\d+\.\d+\.\d+/)[0].substring(1);
    } catch(e) {
      version = null;
    }
    callback(version);

  });

}
