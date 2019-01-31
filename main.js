const http = require('http');
const fs = require('fs');
const mime = require('mime-types');
const url = require('url');
const formidable = require('formidable');
const crypto = require('crypto');
let port = 80;
let htdocs = __dirname+'/htdocs';
let methods = {};
const server = http.createServer();
server.listen(port);
server.on('listening', ()=>{
    console.log("HTTP Encryption Server Ready");
    console.log("Server Started on PORT:"+port);
});
server.on('request', ( req, res )=>{
    let urlParsed = url.parse(req.url);
    console.log("REQUEST: "+urlParsed.path);
    console.log(JSON.stringify(urlParsed));
    if(urlParsed.pathname == '/'){
        methods.sendFile( res, "/form.html");
    }else if(urlParsed.pathname == '/encryptFile'){
        
    }else{
        methods.sendFile( res, urlParsed.pathname );
    }
});
methods.sendFile = ( res, file )=>{
    let filePath = htdocs+file;
    if( fs.existsSync( htdocs+file ) ){
        let fileStream = fs.createReadStream( filePath );
        fileStream.pipe( res );
        fileStream.on('close', ()=>{
            res.end();
        });
    }else{
        methods.notFound( res, file );
    }
}
methods.notFound = ( res, file )=>{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<head><title>Not Found</title></head><body><center><h1>File Not Found: "+file+"</h1></center></body>");
    res.end();
}