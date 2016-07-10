var http = require('http');
var express = require("express");
var mongoskin = require('mongoskin');
var path = require("path");
var randtoken = require('rand-token');
var url = require('url');
var URI = require("urijs");


// Connection URL. This is where your mongodb server is running.
var urlDB = 'mongodb://admin:a199412@ds017205.mlab.com:17205/url_shortener';
var db = mongoskin.db(urlDB, {safe:true})


var app = express();
app.param('collectionName', function(req, res, next,collectionName){
  req.collection = db.collection(collectionName)
  return next()
});

app.use(express.static(path.join(__dirname, 'client')));

var server = http.createServer(app);


app.get('/', function(req,res) {
  res.status(200).sendFile('index.html', { root: path.join(__dirname, 'client') });
});

app.get('/:collectionName/add/:url1//:url2', function(req, res){
    
    if(req.params.collectionName !== 'urls'){
        res.send(JSON.stringify({
            error: "Wrong Call."
        }));
    }else{
        var urls = req.collection;
        var url = req.params.url1 + "//" + req.params.url2;
        var row = {
               original: url,
               short: fullUrl(req) +"/urls/"+randtoken.generate(4).toLowerCase()
        };
        if(isValidURI(url)){
            urls.insert(row);
            row.sucess = "Url Saved successfully!"
            delete row._id;
            res.send(JSON.stringify(row));
        }else{
            res.send(JSON.stringify({
                error: "Url you provide is not valid"
            }));
        }
    }
});

app.get('/:collectionName/:token', function(req, res){
 if(req.params.collectionName !== 'urls'){
        res.send(JSON.stringify({
            error: "Wrong Call."
        }));
    }else{
      req.collection.find({short : fullUrl(req) +"/urls/"+req.params.token}).toArray(function(e, results){
        if(!e){
           res.writeHead(301,{Location: results[0].original});
            res.end();
        }
      });

    }
    
    
});


function isValidURI(url) {
    try {
        (new URI(url));
        return true;
    }
    catch (e) {
        // Malformed URI
        return false;
    }
}

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: (req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host
    });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Url Shortener server listening at", addr.address + ":" + addr.port);
});
