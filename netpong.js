var http = require('http'),
  path = require('path'),
  fs = require('fs');


http.createServer(function(req,res){
  console.log(req.url);
  res.writeHead(200,{'Content-type':'text/html'});
  res.end('<b>in:side</b>');
}).listen(9090);