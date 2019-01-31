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
        methods.encryptFileFromForm( req, res );
    }else if(urlParsed.pathname == '/decryptFile'){
        methods.decryptFileFromForm( req, res );
    }else{
        methods.sendFile( res, urlParsed.pathname );
        let filePath = htdocs+urlParsed.pathname;
        if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
        }
    }
});
methods.encryptFileFromForm = ( req, res )=>{
    let form = new formidable.IncomingForm();
    form.uploadDir = htdocs+'/temp';
    form.maxFileSize = 20 * 1024 * 1024;;
    form.parse(req, ( err,fields,files )=>{
        if(err){
            methods.error( res, err );
        }else{
            if(files.fileHere){
                if(fields.password){
                    var password = fields.password.toString('hex');
                }else{
                    var password = 'password';
                }
                let encrypt = crypto.createCipher('aes-256-cbc', password);
                let oldFile = fs.createReadStream(files.fileHere.path);
                let newFile = fs.createWriteStream(htdocs+'/'+files.fileHere.name);
                oldFile.pipe(encrypt).pipe(newFile);
                newFile.on('finish', ()=>{
                    fs.unlinkSync(files.fileHere.path);
                    if(fs.existsSync(files.fileHere.path)){
                        fs.unlinkSync(files.fileHere.path);
                    }
                    //res.writeHead(200,{'Content-Type' : mime.lookup(files.fileHere.name)});
                    res.writeHead(301,{'Location' : files.fileHere.name});
                    res.end();
                });
            }else{
                methods.error( res, "Invalid Form" );
            }
        }
    });
};
methods.decryptFileFromForm = ( req, res )=>{
    let form = new formidable.IncomingForm();
    form.uploadDir = htdocs+'/temp';
    form.maxFileSize = 20 * 1024 * 1024;;
    form.parse(req, ( err,fields,files )=>{
        if(err){
            methods.error( res, err );
        }else{
            if(files.fileHere){
                if(fields.password){
                    var password = fields.password.toString('hex');
                }else{
                    var password = 'password';
                }
                if(fs.existsSync(files.fileHere.path)){
                    let oldFile = fs.createReadStream(files.fileHere.path);
                    let newFile = fs.createWriteStream(htdocs+'/'+files.fileHere.name);
                    let decrypt = crypto.createDecipher('aes-256-cbc', password);
                    oldFile.pipe(decrypt).pipe(newFile);
                    newFile.on('finish', ()=>{
                        fs.unlinkSync(files.fileHere.path);
                        if(fs.existsSync(files.fileHere.path)){
                            fs.unlinkSync(files.fileHere.path);
                        }
                        res.writeHead(301,{'Location' : files.fileHere.name});
                        res.end();
                    });
                    decrypt.on('error', (error)=>{
                        if(fs.existsSync(files.fileHere.path)){
                            fs.unlinkSync(files.fileHere.path);
                        }
                        if(fs.existsSync(htdocs+'/temp/'+files.fileHere.name)){
                            fs.unlinkSync(htdocs+'/temp/'+files.fileHere.name);
                        }
                        methods.error( res, "Wrong Password" );
                    });   
                }else{
                    methods.error( res, "Invalid Form" );
                }
            }else{
                methods.error( res, "Invalid Form" );
            }
        }
    });
};
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
};
methods.notFound = ( res, file )=>{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<head><title>Not Found</title></head><body><center><h1>File Not Found: "+file+"</h1></center></body>");
    res.end();
};
methods.error = ( res, err )=>{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<head><title>Error</title></head><body><center><h1>File Not Found: "+err+"</h1></center></body>");
    res.end();
};