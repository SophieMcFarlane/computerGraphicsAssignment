var express = require('express');
var app = express();
var path = require('path');

//setting middleware
app.use(express.static(path.join(__dirname, 'src'))); //Serves resources from folder
app.get('/', (req, res) => {
	res.sendFile('flatwhite.html');
});
var server = app.listen(5000);
console.log('running on port 5000');