var pg = require('pg');
var conString = "pg://postgres:paidb@localhost:5433/paidb";

var client = new pg.Client(conString);
client.connect();

//queries are queued and executed one after another once the connection becomes available

var query = client.query("SELECT * FROM p_users");
//fired after last row is emitted

query.on('row', function(row) {
    console.log(row);
});

query.on('end', function() {
    client.end();
});



