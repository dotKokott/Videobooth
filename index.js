var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/js', express.static('js'));
app.use('/ext_js',express.static('ext_js'));
app.use('/models',express.static('models'));
app.use('/css',express.static('css'));
app.use('/images',express.static('images'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });
  
  http.listen(3000, function(){
    console.log('listening on *:3000');
  });
  
  io.on('connection', function(socket){
    console.log('a user connected');
  });