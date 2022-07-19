var express = require('express'),
  bodyParser = require('body-parser'),
  path = require('path') 
var app = express();
var crypto = require("crypto");
var consumerSecretApp = '2BD3AFE25F9F53B0D583B8BE7099E1057A1ACA46B736A8AF58AB1E62E3C732D8';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://gthzmrkcscclfm:9f798a485fed64de9bcc5f360b541f8bcfa24e96b7f34f149c02f46c38c6fc95@ec2-54-87-179-4.compute-1.amazonaws.com:5432/d88p9db3gss7c3",
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('consumer secret - '+consumerSecretApp);

app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());
 

app.get('/', function (req, res) {
  res.render('hello');
});

app.post('/', function (req, res) { 
  var bodyArray = req.body.signed_request.split(".");
 
    var consumerSecret = bodyArray[0];
    var encoded_envelope = bodyArray[1];
    var db_result;
    var check = crypto.createHmac("sha256", consumerSecretApp).update(encoded_envelope).digest("base64");

    if (check === consumerSecret) { 
        var envelope = JSON.parse(new Buffer(encoded_envelope, "base64").toString("ascii"));
        //req.session.salesforce = envelope;
        console.log("got the session object:");
        console.log(envelope);
        console.log(JSON.stringify(envelope) );
        console.log('recordId: ' + envelope.context.environment.parameters.recordId);
        pool.query(`SELECT * FROM t_inventory;`, (err, res) =>{
          if (err){
            console.log("couldn't get data");
            console.log(err);
          }
          else{
            console.log(res.rows);
            db_result = res;
          }
        
        });
        res.render('index', { title: envelope.context.user.userName, req : JSON.stringify(envelope), 
            recordId : envelope.context.environment.parameters.recordId, inventory: JSON.stringify(db_result) });
    }else{
        res.send("authentication failed");
    } 
})
 
app.listen(process.env.PORT || 3000 , function () {
	console.log ("server is listening!!!");
} );