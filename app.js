var util = require('util'),
    express  = require('express'),

    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),

    config = require('./config'),
    gcal = require('google-calendar'),
    _ = require('underscore');

/*
  ===========================================================================
            Setup express + passportjs server for authentication
  ===========================================================================
*/

var app = express(),
    root_url,
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.configure(function() {

  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());

  app.set('port', process.env.PORT || 3000);
  app.set('environment', process.env.NODE_ENV);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
  
  console.log(app.get('environment'));

  // Define root url
  switch (app.get('environment')) {
    case 'production' :
      root_url = config.production_url;
      break;
    default :
      root_url = config.development_url + ":" + app.get('port');
      break;
  }

});

app.listen(app.get('port'), function (){
  console.log('Server is running at ' + root_url);
});

passport.use(new GoogleStrategy({
    clientID: config.consumer_key,
    clientSecret: config.consumer_secret,
    callbackURL: root_url + "/auth/callback",
    scope: ['openid', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/overview');
  });


/*
  ===========================================================================
                               Live reload
  ===========================================================================
*/

// livereload = require('livereload');
// server = livereload.createServer();
// server.watch("./app.js");

/*
  ===========================================================================
                               Routers
  ===========================================================================
*/

app.get('/', function (req, res) {
  res.render('index', { title : 'Welcome' } );
});

app.get('/overview', function (req, res) {
  var accessToken     = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);

  google_calendar.calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    
    console.log(data.items);

    // Render overview
    res.render('overview', { title : 'Overview', calendars : data.items });
  });
});

app.get('/overview/:id', function (req, res) {
  var accessToken     = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);

  google_calendar.events.list(req.params.id, function(err, data) {
    if(err) return res.send(500,err);

    console.log(data.items);

    // Render calendar data
    res.render('calendar', { title : 'Calendar', calendar : data.items });

  });
});

// app.all('/', function (req, res){
//   if(!req.session.access_token) return res.redirect('/auth');
  
//   var accessToken     = req.session.access_token;
//   var google_calendar = new gcal.GoogleCalendar(accessToken);
//   var calendarId      = "ceeb28co8gpi5fra4m2ivstdbg@group.calendar.google.com";//req.params.calendarId;
//   var searchTerm      = "Umwelt".toLowerCase();

//   /*google_calendar.calendarList.list(function(err, data) {
//     if(err) return res.send(500,err);
//     return res.send(data);
//   });*/

//   // google_calendar.calendarList.list(function(err, data) {
//   //   if(err) return res.send(500,err);
//   //   return res.send(data);
//   // });

//   //console.log(google_calendar.events.list);
  
//   google_calendar.events.list(calendarId, function(err, data) {
//     if(err) return res.send(500,err);

//     var filtered = [];
//     _.each(data.items, function (event){
//       //console.log()
//       console.log(event.summary.toLowerCase());
//       if(event.summary.toLowerCase().indexOf(searchTerm) > -1)
//         filtered.push(event);
//     })
//     return res.send(filtered);
//   });
// });




/*
  ===========================================================================
                               Reference code
  ===========================================================================
*/

/*app.all('/', function(req, res){
  
  console.log("HI");
  console.log("HI");
  console.log("HI");
  console.log('token', req.session.access_token);

  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);

  console.log(google_calendar);

  google_calendar.calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});

app.all('/:calendarId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  var calendarId      = req.params.calendarId;
  
  google_calendar.events.list(calendarId, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});

app.all('/:calendarId/add', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  var calendarId      = req.params.calendarId;
  var text            = req.query.text || 'Hello World';
  
  google_calendar.events.quickAdd(calendarId, text, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/'+calendarId);
  });
});

app.all('/:calendarId/:eventId/remove', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  
  google_calendar.events.delete(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/'+calendarId);
  });
});*/