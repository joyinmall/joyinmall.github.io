var express = require('express');
var app     = express();
var http    = require('http').Server(app);

app.use(express.static(__dirname + '/game'));

http.listen(80, function() {
  console.log("Server is listening on port 80");
});
