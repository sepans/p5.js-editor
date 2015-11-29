var Path = nodeRequire('path');
var $ = require('jquery');
var _ = require('underscore');
var Files = require('./files');

var menubar = new gui.Menu({ type: 'menubar' });
if (!isWin) {
  menubar.createMacBuiltin("p5");
}
var fileMenu = new gui.Menu();
var help = new gui.Menu();

var view = new gui.Menu();
var win = gui.Window.get();
var recentFilesMenu = new gui.Menu();
var exampleCategoryMenu = new gui.Menu();
var openRecent, examples;
var fs = nodeRequire('fs');

/* setup the menubar menus, submenus, functions and shortcuts. Conceptually the
 * menubar is an array of Menus, each of which is an array of MenuItems.
 * Menuitems may themselves be a submenu
 */
module.exports.setup = function(app) {
  if (isWin) {
    //Setup menus for windows  
    fileMenu.append(new gui.MenuItem({ 
      label: 'New Project                          Ctrl+Shift+N',
      modifiers: 'shift-ctrl', key: 'n', click: function(){
        app.newWindow(app.windowURL);
    }}));

    fileMenu.append(new gui.MenuItem({ 
      label: 'New File                                           Ctrl+N',
      modifiers: 'ctrl', key: 'n', click: function(){
        app.newFile();
    }}));

    fileMenu.append(new gui.MenuItem({ 
      label: 'New Folder',
      click: function(){
        app.newFolder();
    }}));

    fileMenu.append(new gui.MenuItem({ 
      label: 'Open                                                 Ctrl+O',
      modifiers: 'ctrl', key: 'o', click: function(){
        $('#openFile').trigger('click');
    }}));

    openRecent = new gui.MenuItem({label: 'Open Recent'});
    module.exports.updateRecentFiles(app);
    fileMenu.append(openRecent);

    fileMenu.append(new gui.MenuItem({ 
      label: 'Close                                                Ctrl+W',
      modifiers: 'ctrl', key: 'w', click: function(){
        app.closeProject();
    }}));

    fileMenu.append(new gui.MenuItem({ 
      label: 'Save                                                   Ctrl+S',
      modifiers: 'ctrl', key: 's', click: function(){
        app.saveFile();
    }}));

    // fileMenu.append(new gui.MenuItem({ 
    //   label: 'Save File As...                         Ctrl+Shift+S',
    //   modifiers: 'shift-ctrl', key: 's', click: function(){
    //     app.saveFileAs(app.currentFile.path);
    // }}));

    fileMenu.append(new gui.MenuItem({ 
      label: 'Save As...           Ctrl+Shift+S',
      modifiers: 'shift-ctrl', key: 's', click: function(){
        $('#saveProject').trigger('click');
    }}));

    // add menu option for loading example sketches
    examples = new gui.MenuItem({label: 'Examples'});
    // create submenu
    var exampleDir = Path.join('mode_assets', 'p5', 'examples');
    // get latest example categories
    var files = fs.readdirSync(exampleDir);

    files.forEach(function(category) {
      var sketchMenu = new gui.Menu();
      var categoryLabel = new gui.MenuItem({label: category});
      // populate submenu with sketches for that category
      var categoryDir = Path.join(exampleDir, category);
      if (fs.lstatSync(categoryDir).isDirectory()) {
        var sketches = fs.readdirSync(categoryDir);
        sketches.forEach(function(fileName) {
          sketchMenu.append(new gui.MenuItem({label: Files.cleanExampleName(fileName), click: function(){
            app.modeFunction('launchExample', exampleDir.concat('/').concat(category).concat('/').concat(fileName));
          }}));
        });
        categoryLabel.submenu = sketchMenu;
        exampleCategoryMenu.append(categoryLabel);
      }
    });

    examples.submenu = exampleCategoryMenu;
    fileMenu.append(examples);

    fileMenu.append(new gui.MenuItem({ type: 'separator' }));

    fileMenu.append(new gui.MenuItem({ 
      label: 'Run                           Ctrl+R',
      modifiers: 'ctrl', key: 'r', click: function(){
        app.run();
    }}));

    view.append(new gui.MenuItem({ 
      label: 'Show Sketch Folder             Ctrl+K',
        modifiers: 'ctrl', key: 'k', click: function(){
          gui.Shell.showItemInFolder(app.projectPath);
    }}));

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ 
      label: 'Reformat                               Ctrl+T',
        modifiers: 'ctrl', key: 't', click: function(){
          app.$.editor.reformat();
    }}));

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ 
      label: 'Toggle Settings Panel           Ctrl+,',
      modifiers: 'ctrl', key: ',', click: function(){
        app.toggleSettingsPane();
    }}))

    view.append(new gui.MenuItem({ 
      label: 'Toggle Sidebar                       Ctrl+.',
      modifiers: 'ctrl', key: '.', click: function(){
        app.toggleSidebar();
    }}))

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ 
      label: 'Increase Font Size                 Ctrl+=',
      modifiers: 'ctrl', key: '=', click: function(){
        app.changeFontSize(1);
    }}))

    view.append(new gui.MenuItem({ 
      label: 'Decrease Font Size                Ctrl+-',
      modifiers: 'ctrl', key: '-', click: function(){
        app.changeFontSize(-1);
    }}))
  } else {
    fileMenu.append(new gui.MenuItem({ label: 'New Project',
      modifiers: 'shift-cmd', key: 'n', click: function(){
        app.newWindow(app.windowURL);
    }}));

    fileMenu.append(new gui.MenuItem({ label: 'New File',
      modifiers: 'cmd', key: 'n', click: function(){
        app.newFile();
    }}));

    fileMenu.append(new gui.MenuItem({ label: 'New Folder',
      click: function(){
        app.newFolder();
    }}));

    fileMenu.append(new gui.MenuItem({ label: 'Open',
      modifiers: 'cmd', key: 'o', click: function(){
        $('#openFile').trigger('click');
    }}));

    openRecent = new gui.MenuItem({label: 'Open Recent'});
    openRecent.submenu = recentFilesMenu;
    fileMenu.append(openRecent);

    fileMenu.append(new gui.MenuItem({ label: 'Close',
      modifiers: 'cmd', key: 'w', click: function(){
        app.closeProject();
    }}));

    fileMenu.append(new gui.MenuItem({ label: 'Save',
      modifiers: 'cmd', key: 's', click: function(){
        app.saveFile();
    }}));

    // fileMenu.append(new gui.MenuItem({ label: 'Save File As...',
    //   modifiers: 'shift-cmd', key: 's', click: function(){
    //     app.saveFileAs(app.currentFile.path);
    // }}));

    fileMenu.append(new gui.MenuItem({ label: 'Save As...',
      modifiers: 'shift-cmd', key: 's', click: function(){
        $('#saveProject').trigger('click');
    }}));

    // add menu option for loading example sketches
    examples = new gui.MenuItem({label: 'Examples'});
    // create submenu
    var exampleDir = Path.join('mode_assets', 'p5', 'examples');
    // get latest example categories
    var files = fs.readdirSync(exampleDir);

    files.forEach(function(category) {
      var sketchMenu = new gui.Menu();
      var categoryLabel = new gui.MenuItem({label: category});
      // populate submenu with sketches for that category
      var categoryDir = Path.join(exampleDir, category);
      if (fs.lstatSync(categoryDir).isDirectory()) {
        var sketches = fs.readdirSync(categoryDir);
        sketches.forEach(function(fileName) {
          sketchMenu.append(new gui.MenuItem({label: Files.cleanExampleName(fileName), click: function(){
            app.modeFunction('launchExample', exampleDir.concat('/').concat(category).concat('/').concat(fileName));
          }}));
        });
        categoryLabel.submenu = sketchMenu;
        exampleCategoryMenu.append(categoryLabel);
      }
    });

    examples.submenu = exampleCategoryMenu;
    fileMenu.append(examples);

    fileMenu.append(new gui.MenuItem({ type: 'separator' }));

    fileMenu.append(new gui.MenuItem({ label: 'Run',
      modifiers: 'cmd', key: 'r', click: function(){
        app.run();
        
    }}));

    view.append(new gui.MenuItem({ label: 'Show Sketch Folder',
        modifiers: 'cmd', key: 'k', click: function(){
          gui.Shell.showItemInFolder(app.projectPath);
    }}));

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ label: 'Reformat',
        modifiers: 'cmd', key: 't', click: function(){
          app.$.editor.reformat();
    }}));

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ label: 'Toggle Settings Panel',
      modifiers: 'cmd', key: ',', click: function(){
        app.toggleSettingsPane();
    }}))

    view.append(new gui.MenuItem({ label: 'Toggle Sidebar',
      modifiers: 'cmd', key: '.', click: function(){
        app.toggleSidebar();
    }}))

    view.append(new gui.MenuItem({ type: 'separator' }));

    view.append(new gui.MenuItem({ label: 'Increase Font Size',
      modifiers: 'cmd', key: '=', click: function(){
        app.changeFontSize(1);
    }}))

    view.append(new gui.MenuItem({ label: 'Decrease Font Size',
      modifiers: 'cmd', key: '-', click: function(){
        app.changeFontSize(-1);
    }}))
  }

  help.append(new gui.MenuItem({ label: 'Reference', click: function(){
    app.showHelp();
  }}));

  if (isWin) {
    menubar.append(new gui.MenuItem({ label: 'File', submenu: fileMenu}));
    menubar.append(new gui.MenuItem({ label: 'View', submenu: view}));
  } else {
    menubar.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu}),1);
    menubar.insert(new gui.MenuItem({ label: 'View', submenu: view}), 3);
  }

  menubar.append(new gui.MenuItem({ label: 'Help', submenu: help}));

  /* The Edit Menu exists by default, so we obtain the reference to it here and
   * add tot he pre-existing menu
   */
  // Many of these menuItems are different because the ace/brace editor has
  // native shortcuts for these commands. Their respective menuItmes only react
  // to being clicked on, so the shortcuts work without interference.
  if (isWin) {
    var edit = new gui.Menu();

    var undo = new gui.MenuItem(
        { label: 'Undo                                       Ctrl+Z', 
          modifiers: 'ctrl', key: 'z', click: function(){
        }});
    undo.on('click', function(){
      app.$.editor.ace.execCommand("undo");
    });
    edit.append(undo);

    var redo = new gui.MenuItem(
        { label: 'Redo                             Ctrl+Shift+Z', 
          modifiers: 'shift-ctrl', key: 'z', click: function(){
        }});
    redo.on('click', function(){
      app.$.editor.ace.execCommand("redo");
    });
    edit.append(redo);

    edit.append(new gui.MenuItem({ type: 'separator' }));

    var cut = new gui.MenuItem(
        { label: 'Cut                                          Ctrl+X', 
          modifiers: 'ctrl', key: 'x', click: function(){
        }});
    cut.on('click', function(){
      document.execCommand("cut");
    });
    edit.append(cut);

    var copy = new gui.MenuItem(
        { label: 'Copy                                       Ctrl+C', 
          modifiers: 'ctrl', key: 'c', click: function(){
        }});
    copy.on('click', function(){
      document.execCommand("copy");
    });
    edit.append(copy);

    var paste = new gui.MenuItem(
        { label: 'Paste                                       Ctrl+V', 
          modifiers: 'ctrl', key: 'v', click: function(){
        }});
    paste.on('click', function(){
      document.execCommand("paste");
    });
    edit.append(paste);

    var del = new gui.MenuItem(
        { label: 'Delete                                     Ctrl+D', 
          modifiers: 'ctrl', key: 'd', click: function(){
        }});
    del.on('click', function(){
      app.$.editor.ace.execCommand("del");
    });
    edit.append(del);

    var selAll  = new gui.MenuItem(
        { label: 'Select All                                Ctrl+A', 
          modifiers: 'ctrl', key: 'a', click: function(){
        }});
    selAll.on('click', function(){
      app.$.editor.ace.execCommand("selectall");
    });
    edit.append(selAll);

    edit.append(new gui.MenuItem({ type: 'separator' }));

    var findItem = new gui.MenuItem(
        { label: 'Find                                         Ctrl+F', 
        modifiers: 'ctrl', key: 'f', click: function(){
        }});
    findItem.on('click', function(){
      app.$.editor.ace.execCommand("find");
    });
    edit.append(findItem);

    var repItem = new gui.MenuItem(
      { label: 'Find and Replace           Ctrl+Alt+F',
        modifiers: 'ctrl-alt', key: 'f', click: function(){
      }});
    repItem.on('click', function(e){
      app.$.editor.ace.execCommand("replace");
    });
    edit.append(repItem);

    menubar.insert(new gui.MenuItem({ label: 'Edit', submenu: edit}), 2);

  } else {
    // get the existing edit menu
    var edit = menubar.items[2].submenu;

    // the native undo isn't allowing us to bind a click event on OS X,
    // current (hacky) solution is to remove the existing one and add a new one
    edit.remove(edit.items[0]);

    // create the new undo menu item
    var undo = new gui.MenuItem({
        label: 'Undo',
        key: "z"
    });

    // add event listener
    undo.on('click', function() {
      // execute ace editor undo command
      app.$.editor.ace.execCommand("undo");
    });

    // insert the new undo at the beginning
    edit.insert(undo, 0);

    edit.append(new gui.MenuItem({ type: 'separator' }));

    // Find and Find and Replace are different because the ace/brace editor has
    // native shortcuts for these commands. These two MenuItems only react
    // to being clicked on, so the shortcuts work without interference.
    var findItem = new gui.MenuItem(
        { label: 'Find', modifiers: 'cmd', key: 'f', click: function(){
        }});

    findItem.on('click', function(){
      console.log('find');
      app.$.editor.ace.execCommand("find");
    });

    edit.append(findItem);

    var repItem = new gui.MenuItem(
      { label: 'Find and Replace',
        modifiers: 'cmd-alt', key: 'f', click: function(){
      }});

    repItem.on('click', function(e){
      app.$.editor.ace.execCommand("replace");
    });

    edit.append(repItem);
  }

  win.menu = menubar;

};

//reset the menubar to the current window's frame of reference. Used whenever
//the user switches focus between windows
module.exports.resetMenu = function() {
  win.menu = menubar;
};

module.exports.updateRecentFiles = function(app, path) {
  var recentFiles = JSON.parse(localStorage.recentFiles || '[]');

  if (typeof path !== 'undefined' && !app.temp) {
    recentFiles.unshift(path);
  }

  recentFiles = _.unique(recentFiles);

  if (recentFiles.length > 10) recentFiles.pop();

  localStorage.recentFiles = JSON.stringify(recentFiles);

  // clear the recentFilesMenu because we're going to repopulate it
  recentFilesMenu = new gui.Menu();
  openRecent.submenu = recentFilesMenu;

  // iterate through the recentFiles and append to the openRecent submenu
  recentFiles.forEach(function(p) {
    var m = new gui.MenuItem({ label: Path.basename(p), click: function() {
      app.openProject(p);
    }});
    recentFilesMenu.append(m);
  });
  if (recentFiles.length > 0) {
    recentFilesMenu.append(new gui.MenuItem({type: 'separator'}));
    recentFilesMenu.append(new gui.MenuItem({label: 'Clear Recent Projects', click: function(){
      localStorage.recentFiles = [];
      module.exports.updateRecentFiles(app);
    }}));
  }

  openRecent.enabled = (recentFiles.length !== 0);
};
