# time-spent

Calculate time spent on events in your Google Calendar like time spent on a freelance gig once it's time to send out invoices.

## Usage

Rename config-sample.js to config.js and input your credentials.

``` js
module.exports = {
   consumer_key    : 'YOUR_GOOGLE_CONSUMER_KEY',
   consumer_secret : 'YOUR_GOOGLE_CONSUMER_SECERET'
}
```

Create an app and get your credentials here: https://code.google.com/apis/console - remember to turn on 'Calendar API' under 'Services'.

## Notes

This project is one of my first Node.js projects and has not been tested very thoroughly. This was only meant to be a test-project to get dirty with Node and therefore might contain critical bugs.

Hope you find it useful and if so, please let me know in which cases you did use it!