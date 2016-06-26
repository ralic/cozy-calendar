// Generated by CoffeeScript 1.10.0
var cozydb;

cozydb = require('cozydb');

module.exports.sendShareInvitations = function(event, callback) {
  var data, guests, hasGuestToShare, needSaving;
  guests = event.toJSON().attendees;
  needSaving = false;
  hasGuestToShare = guests.find(function(guest) {
    return guest.isSharedWithCozy && (guest.status === 'INVITATION-NOT-SENT');
  });
  if (!hasGuestToShare) {
    return callback();
  }
  data = {
    desc: event.description,
    rules: [
      {
        id: event.id,
        docType: 'event'
      }
    ],
    targets: [],
    continuous: true
  };
  guests.forEach(function(guest) {
    if ((guest.status === 'INVITATION-NOT-SENT') && guest.isSharedWithCozy) {
      data.targets.push({
        recipientUrl: guest.cozy
      });
      guest.status = "NEEDS-ACTION";
      return needSaving = true;
    }
  });
  return cozydb.api.createSharing(data, function(err, body) {
    if (err != null) {
      return callback(err);
    } else if (!needSaving) {
      return callback();
    } else {
      return event.updateAttributes({
        attendees: guests
      }, callback);
    }
  });
};