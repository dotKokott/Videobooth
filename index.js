var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use('/static', express.static('public/static'));
app.use('/js', express.static('public/js'));
app.use('/css', express.static('public/css'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
  
http.listen(3000, function() {
  console.log('listening on *:3000');
});
  
io.on('connection', function(socket) {
  console.log('a user connected');
});