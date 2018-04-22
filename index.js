var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs');
var uuid = require('node-uuid');
var url = require('url');
var restler = require('restler-base');

app.use('/static', express.static('public/static'));
app.use('/js', express.static('public/js'));
app.use('/css', express.static('public/css'));
app.use('/uploads', express.static('uploads'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
  
http.listen(3000, function() {
  console.log('listening on *:3000');
});
  
io.sockets.on('connection', function(socket) {
  socket.on('message', function (data) {
    var fileName = uuid.v4();
    
    if (data.video) {
        var savedPath = writeToDisk(data.video.dataURL, fileName + '.webm');        
        socket.emit('saved', fileName + '.webm');
        uploadToProvider(savedPath, function(url) {
          socket.emit('uploaded', url);
        });
    }    
  });
});

function uploadToProvider(filePath, callback) {
  fs.stat(filePath, function(err, stats) {
    restler.post("https://webmshare.com/api/upload", {
        multipart: true,
        data: {            
            "file": restler.file(filePath, null, stats.size, null, "video/webm"),
            "expiration": "1"
        }
    }).on("complete", function(data) {
        callback('https://webmshare.com/' + data.id);        
    });
});
}

function writeToDisk(dataURL, fileName) {
  var fileExtension = fileName.split('.').pop(),
      fileRootNameWithBase = './uploads/' + fileName,
      filePath = fileRootNameWithBase,
      fileID = 2,
      fileBuffer;

  // @todo return the new filename to client
  while (fs.existsSync(filePath)) {
      filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
      fileID += 1;
  }

  dataURL = dataURL.split(',').pop();
  fileBuffer = new Buffer(dataURL, 'base64');
  fs.writeFileSync(filePath, fileBuffer);

  console.log('filePath', filePath);

  return filePath;
}