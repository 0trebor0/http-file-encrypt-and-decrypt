const http = require('http'),
fs = require('fs'),
crypto = require('crypto'),
formidable = require('formidable'),
mime = require('mime-types'),
serverPort = '8080';
const server = http.createServer();
server.on('request', (req,res)=>{requestReply(req,res)});
server.on('listening',()=>{
	console.log('Server Started:'+serverPort);
});
server.listen(serverPort);
requestReply = (req, res)=>{
    try{
        console.log("REQ: "+req.url);
        if(req.url == '/'){
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.end(fs.readFileSync(__dirname+"/form.html"));
        }else if(req.url == '/encryptFile'){
            encryptFileAndReply(req, res);
        }else if(req.url == '/decryptFile'){
            decryptFileAndReply(req, res);
        }else if(fs.existsSync(__dirname+'/htdocs/temp'+req.url)){
            //res.writeHead(200, {'Content-Type' : mime.lookup(__dirname+'/htdocs/temp'+req.url)});
            res.setHeader('Content-disposition', 'attachment; filename='+req.url.slice(1)+'');
            //res.end(fs.createReadStream(__dirname+'/htdocs/temp'+req.url));
            var tu = fs.createReadStream(__dirname+'/htdocs/temp'+req.url);
            tu.pipe(res);
            tu.on('end',()=>{
                res.end();
                if(fs.existsSync(__dirname+'/htdocs/temp'+req.url)){
                    fs.unlinkSync(__dirname+'/htdocs/temp'+req.url);
                }
            });
        }else{
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.write("<center>FILE NOT FOUND</center>");
            res.end();
        }
    }catch(err){
        console.error(err);
    }
}
encryptFileAndReply = (req, res)=>{
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname+'/temp';
    form.maxFileSize = 200 * 1024 * 1024;
    form.parse(req, (err,fields,files)=>{
        if(err){
            console.log(err);
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.write("<center>ERROR</center>");
            res.end();
        }
        if(files.fileHere){
            if(fields.password){
                var password = fields.password.toString('hex');
            }else{
                var password = 'password';
            }
            var encrypt = crypto.createCipher('aes-256-cbc', password);
            var oldFile = fs.createReadStream(files.fileHere.path);
            var newFile = fs.createWriteStream(__dirname+'/htdocs/temp/'+files.fileHere.name);
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
            res.writeHead(301, {'Content-Type' : 'text/html','Location':'/'});
            res.write("<center>ERROR</center>");
            res.end();
        }
    });
}
decryptFileAndReply = (req, res)=>{
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname+'/temp';
    form.maxFileSize = 200 * 1024 * 1024;
    form.parse(req, (err,fields,files)=>{
        if(err){
            console.log(err);
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.write("<center>ERROR</center>");
            res.end();
        }
        if(files.fileHere){
            if(fields.password){
                var password = fields.password.toString('hex');
            }else{
                var password = 'password';
            }
            if(fs.existsSync(files.fileHere.path)){
                var oldFile = fs.createReadStream(files.fileHere.path);
                var newFile = fs.createWriteStream(__dirname+'/htdocs/temp/'+files.fileHere.name);
                var decrypt = crypto.createDecipher('aes-256-cbc', password);
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
                    if(fs.existsSync(__dirname+'/htdocs/temp/'+files.fileHere.name)){
                        fs.unlinkSync(__dirname+'/htdocs/temp/'+files.fileHere.name);
                    }
                    res.writeHead(301, {'Content-Type' : 'text/html'});
                    res.write("<center><p>Reasons:</p>Wrong Password<br>Any other server errors</center>");
                    res.end();
                });   
            }else{
                res.writeHead(301, {'Content-Type' : 'text/html'});
                res.write("<center><p>Reasons:</p>Wrong Password<br>Any other server errors</center>");
                res.end();
            }
        }else{
            res.writeHead(301, {'Content-Type' : 'text/html','Location':'/'});
            res.write("<center>ERROR</center>");
            res.end();
        }
    });
}
decryptFile = (req,res)=>{

}