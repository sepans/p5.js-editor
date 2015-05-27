var gulp = require('gulp');
var NwBuilder = require('node-webkit-builder');

var child = require('child_process');
var childProcesses = {};

var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var notify = require('gulp-notify');
var zip = require('gulp-zip');
var browserify = require('gulp-browserify');
var partialify = require('partialify');
var release = require('github-release');
var download = require("gulp-download");
var Path = require('path');
var fs = require('fs');
var info = require('./package.json');

var net = require('net');



console.log(info.devDependencies.nw)
var builderOptions = {
  version: info.devDependencies.nw,
  buildType: 'versioned',
  files: [ './public/**'],
  buildDir: './dist',
  platforms: ['osx64'],
  macIcns: './icons/p5js.icns'
};

var binaryDir = Path.join(builderOptions.buildDir, info.name + " - v" + info.version, 'osx64');
var latestDir = Path.join(Path.join(builderOptions.buildDir, 'latest'));

var jsPath = ['./app/*.js', './app/**/*.js', './app/**/*.html', './public/index.html'];
var cssPath = './app/**/*.scss';
var htmlPath = './app/**/*.html';

//////////////////////////////////////////////////////////////// node-webkit
 
function startNodeWebkit () {

  console.log('strating node-webkit');
 
  if (childProcesses['node-webkit']) childProcesses['node-webkit'].kill();
  
  console.log(info.scripts, info.scripts.app);
 
  //var nwProcess = childProcesses['node-webkit'] = child.spawn('./node_modules/.bin/nw', ['public', '--remote-debugging-port=9222']);

 var nwProcess = childProcesses['node-webkit'] = child.execFile('./node_modules/.bin/nw', 
['public', '--remote-debugging-port=9292'], function(err, stdout, stderr) { 
    // Node.js will invoke this callback when the 
    console.log('stdout', stdout); 
});  

  nwProcess.stderr.on('data', function (data) {

  console.log('data ',data);

    var log = data.toString().match(/\[.*\]\s+(.*), source:.*\/(.*)/);
    if (log) process.stdout.write('[node] '+log.slice(1).join(' ')+'\n');
  });
 
}
 
gulp.task('node-webkit', startNodeWebkit);
 
// Press [ENTER] to manually restart nw.
/*
process.stdin.on('data', function (data) {
  if (data.toString() === '\n') startNodeWebkit();
});
*/




gulp.task('browserify', function() {
  gulp.src('./app/main.js', { read: false })
    .pipe(plumber())
    .pipe(browserify({
      transform: [partialify],
    }))
    .on("error", notify.onError({
      message: "<%= error.message %>",
      title: "Error"
    }))
    .pipe(rename('main.js'))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('css', function() {
  gulp.src(cssPath)
    .pipe(plumber())
    .pipe(concat('main.css'))
    .pipe(sass({
      //outputStyle: 'compressed'
    }))
    .pipe(gulp.dest('./public/css/'));
});

//////////////////////////////////////////////////////////////// reload
 
 
console.log('setting up reload');

//var socket = net.createConnection({port: 9292, host: 'localhost'});
/*
console.log('Socket created.');
socket.on('data', function(data) {
  // Log the response from the HTTP server.
  console.log('RESPONSE: ' + data);
}).on('connect', function() {
  console.log('connection made');
});
*/

console.log('window', window);


gulp.task('reload', function () { 
 // console.log('RELOAD', socket);
  //socket.write('reload');
  //console.log('location', window.location);
  //location.reload();
});




/*

var reload;
 
gulp.task('reload', function () {

  if(!reload) {
    console.log('createing reload');
 
    net.createServer(function(socket) {
      console.log('connected', socket);
      reload = socket;

      console.log(' reload', reload);


    }).listen(9292, function() {

    reload.write('reload');

  });



  }
  else {
  reload.write('reload');
}
});

*/


gulp.task('watch', function() {
  gulp.watch(jsPath, ['browserify']);
  gulp.watch(cssPath, ['css']);
  gulp.watch(htmlPath, ['reload']);
});


function build (cb) {
  var nw = new NwBuilder(builderOptions);

  nw.on('log', console.log);

  nw.build().then(function () {
    cb();
  }).catch(function (error) {
    console.error(error);
  });

}


function latest () {
  console.log('Compressing...');

  return gulp.src(binaryDir + '/**').
    pipe(zip('p5.zip')).
    pipe(gulp.dest(latestDir)).
    on('end', function(){
      console.log('Build compressed');
    });
}

gulp.task('p5', function () {
  var urls = [
    'https://raw.githubusercontent.com/lmccart/p5.js/master/lib/p5.js',
    'https://raw.githubusercontent.com/lmccart/p5.js/master/lib/addons/p5.sound.js',
    'https://raw.githubusercontent.com/lmccart/p5.js/master/lib/addons/p5.dom.js',
  ];

  urls.forEach(function(url) {
    download(url)
      .pipe(gulp.dest("./public/mode_assets/p5/empty_project/libraries/"));
  });
});

gulp.task('release', function(){
  build(function(){
    latest().pipe(release(info));
  })
});

gulp.task('build', build);
gulp.task('latest', latest);
gulp.task('default', ['css', 'browserify', 'node-webkit', 'watch']);


//////////////////////////////////////////////////////////////// finish
/*
process.on('exit', function () {
  for (var c in childProcesses) childProcesses[c].kill();
});
*/

