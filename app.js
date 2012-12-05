var application_root = __dirname,
  express = require("express"),
  path = require("path");

var app = express();
var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');

  

var allowCrossDomain = function(req, res, next) {

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.header("Access-Control-Allow-Headers", "origin, x-requested-with, content-type");
     // intercept OPTIONS method

    if ('OPTIONS' == req.method) {
      res.send(200);
    } else{
      next();
    }
};

app.configure(function(){
  app.use(allowCrossDomain);
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

});


app.listen(3000);
console.log('Server started on port 3000');

//get a specific  floorplan
app.get(':id', function(req,res){

  console.log(req.params);
  res.send(req.params.id);
});

app.get('*', function(req, res){
  var path = String(req.params);
  var filename = getFilename(path);
  var dir = getDir(path);
  stats = fs.lstatSync(__dirname+'/'+dir+filename);
  if (stats.isDirectory()) {
    //is a directory, concat and return all file contents
    var allFileContents = [];
    var files = fs.readdir(__dirname+'/'+path,function(err,files){
      if (err) {
        res.status = 404;
        res.send(err);
        console.log('couldnt read the requested directory');
      }
      files.forEach(function(fileName){
        if(fileName != '.DS_Store'){
          var data = fs.readFileSync(__dirname+path+'/'+fileName, 'utf8');
          if(!data) console.log(err);
          allFileContents.push(JSON.parse(data));
        } else {
          console.log('DS_Store file in the floorplans folder');
        }
      });
    console.log('retrieved data from '+files );
    res.send(allFileContents);
    });
  } else {
    //get single file contents
     fs.readFile(__dirname+'/'+path, 'utf8', function (err,data) {
      if (err) {
        res.status = 404;
        res.send(err);
        return console.log(err);
      }
      console.log('retrieved file '+filename);
      res.status = 200;
      res.send(data);
    });
  }

});

// //add a file
app.post('*', function(req, res){

  var path = String(req.params);
  var filename = getFilename(path);
  var dir = getDir(path);
  console.log(dir+filename);

  //create the directory if it doesnt exist
  mkdirp(__dirname+'/'+dir, function (err) {
    if (err) {
      res.send(err);
      console.error(err);
    }
  });
  //write the file
  fs.writeFile(__dirname + "/" +dir+filename, JSON.stringify(req.body,null,4), function (err) {
    if (err) {
      return console.log('generic error'+err);
    }
    res.status = 200;
    res.send('success');
  });
});

//delete a file
app.delete('*', function(req, res){
  var path = String(req.params);
  var filename = getFilename(path);
  var dir = getDir(path);

  fs.unlink(__dirname + "/" +dir+filename, function (err) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    console.log('deleted file:'+filename);
    res.status = 200;
    res.send('success');
  });
});
//update a floorplan
app.put('*', function(req, res){
  var path = String(req.params);
  var filename = getFilename(path);
  var dir = getDir(path);
  fs.writeFile(__dirname + "/" +dir+filename, JSON.stringify(req.body,null,4), function (err) {
    if (err) {
      return console.log(err);
    }
    fs.readFile(__dirname + "/" +dir+filename, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      console.log('updated floorplan:'+filename);
      res.send(data);
    });
    //res.send('file updated:'+filename);
  });

});

function getFilename(path){
  return path.substr(path.lastIndexOf('/')+1,path.length);
}
function getDir(path){
  return path.substr(1,path.lastIndexOf('/'));
}
function getExtension(filename) {
  var ext = path.extname(filename||'').split('.');
  return ext[ext.length - 1];
}

