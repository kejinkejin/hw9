var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var mongo = require('mongoskin');
var deferr = require('deferred')
var index = require('./routes/index');
var users = require('./routes/users');
var geolocation = require('geolocation')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//add location point
app.get('/add', function(req, res){
  
  var db = mongo.db('mongodb://localhost:27017/hw9', {native_parser:true});
  /*db.collection('geolocations').find().toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
  });*/

  fs.readFile('geolocations.json', 'utf8', function (err, data) {
    if (err) throw err;
    console.log(data);
    var json = JSON.parse(data);
    db.collection('geolocations').insert(json, function(err, doc) {
        if(err) {
          if(err.code===11000){
            //duplicate error
          }
          else{
            throw err;
          }
        }
        console.log(doc);
    });
    
  });
});
//search by current location
app.get('/search', function(req, res){
  res.sendFile(path.join('C:/Users/asklong/Desktop/mum courses/mwa/hw9/MyApp', '/search.html'));
});



//get current result
app.post('/getresult', function(req, res){
  let city = req.body.city;
  let cate = req.body.category;
  var db = mongo.db('mongodb://localhost:27017/hw9', {native_parser:true});
  var currentLong;
  var currentLat;

  geolocation.getCurrentPosition(function (err, position) {
    if (err) throw err
    console.log(position)
    var currentLat = position.coords.latitude;
    var currentLong = position.coords.longitude;

    db.collection('geolocations').find( {$and:  [  {location:{$near:[currentLong, currentLat]}}, {locationName: city}, {category:cate}  ]} ).limit(3).toArray( function(err, docs){
      if(err)throw err;
      let data="";
      for(let i=0; i<docs.length; i++){
        let doc = docs[i];
        data += '<li>'+doc.category +" "+ doc.locationName +" lon:"+ doc.location[0] +" lat:"+ doc.location[1] + '</li>';
      }
      var body = '<html>'+
        '<head>'+
        '<meta http-equiv="Content-Type" content="text/html; '+
        'charset=UTF-8" />'+
        '</head>'+
        '<body>'+
        data +
        '</body>'+
        '</html>';
      res.end(body);
  });

  });


  

  /*

  
  
  var geoLocation = {
    getLocation: function() {
        var deferred = deferr();
        if(navigator.geolocation) {
            // geo location is supported. Call navigator.geolocation.getCurrentPosition and :
            // - resolve the promise with the returned Position object, or
            // - reject the promise with the returned PositionError object, or
            // - time out after 5 seconds
            navigator.geolocation.getCurrentPosition(deferred.resolve, deferred.reject, { timeout: 5000 });
        } else {
            //geo location isn't supported
            //Reject the promise with a suitable error message
            deferred.reject(new Error('Your browser does not support Geo Location.'));
        }
        return deferred.promise;
    } 
  };
  geoLocation.getLocation().then(position=>{
    
    res.end(currentLat);
    db.collection('geolocations').find({location:{$near:[currentLong, currentLat]}}, function(err,docs){
      res.end('mongo',{data:docs});  
    });
  }).catch(msg=>{
    alert(msg);
  })*/

//res.end(city+cate);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app.listen(1000);
