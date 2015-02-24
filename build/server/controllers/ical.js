// Generated by CoffeeScript 1.9.0
var Event, Tag, fs, ical, localization, multiparty;

ical = require('cozy-ical');

Event = require('../models/event');

Tag = require('../models/tag');

multiparty = require('multiparty');

fs = require('fs');

localization = require('../libs/localization_manager');

module.exports["export"] = function(req, res) {
  var calendar, calendarId;
  calendarId = req.params.calendarid;
  calendar = new ical.VCalendar({
    organization: 'Cozy',
    title: 'Cozy Calendar',
    name: calendarId
  });
  return Event.byCalendar(calendarId, function(err, events) {
    var event, _i, _len;
    if (err) {
      return res.send({
        error: true,
        msg: 'Server error occurred while retrieving data'
      });
    } else {
      if (events.length > 0) {
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          event = events[_i];
          calendar.add(event.toIcal());
        }
      }
      res.header({
        'Content-Type': 'text/calendar'
      });
      return res.send(calendar.toString());
    }
  });
};

module.exports["import"] = function(req, res, next) {
  var form;
  form = new multiparty.Form();
  return form.parse(req, function(err, fields, files) {
    var cleanUp, file, parser, _ref;
    if (err) {
      return next(err);
    }
    cleanUp = function() {
      var arrfile, file, key, _results;
      _results = [];
      for (key in files) {
        arrfile = files[key];
        _results.push((function() {
          var _i, _len, _results1;
          _results1 = [];
          for (_i = 0, _len = arrfile.length; _i < _len; _i++) {
            file = arrfile[_i];
            _results1.push(fs.unlink(file.path, function(err) {
              if (err) {
                return console.log("failed to cleanup file", file.path, err);
              }
            }));
          }
          return _results1;
        })());
      }
      return _results;
    };
    if (!(file = (_ref = files['file']) != null ? _ref[0] : void 0)) {
      res.send({
        error: 'no file sent'
      }, 400);
      return cleanUp();
    }
    parser = new ical.ICalParser();
    return parser.parseFile(file.path, function(err, result) {
      if (err) {
        console.log(err);
        console.log(err.message);
        res.send(500, {
          error: 'error occured while saving file'
        });
        return cleanUp();
      } else {
        return Tag.request('all', function(err, tags) {
          var calendarName, defaultCalendar, key, _ref1, _ref2;
          key = 'default calendar name';
          defaultCalendar = (tags != null ? (_ref1 = tags[0]) != null ? _ref1.name : void 0 : void 0) || localization.t(key);
          calendarName = (result != null ? (_ref2 = result.model) != null ? _ref2.name : void 0 : void 0) || defaultCalendar;
          res.send(200, {
            events: Event.extractEvents(result, calendarName),
            calendar: {
              name: calendarName
            }
          });
          return cleanUp();
        });
      }
    });
  });
};
