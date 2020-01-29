import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Statuses = new Mongo.Collection('statuses');

Meteor.methods({
  'statuses.insert'({name, year, month, x, y}) {
    check(name, String);
    check(x, Number);
    check(y, Number);

    Statuses.insert({name, year, month, x, y});
  },
  'statuses.update'({statusId, x, y}) {
    check(statusId, String);
    check(x, Number);
    check(y, Number);

    Statuses.update(statusId, {$set: {x, y}});
  },
  'statuses.removeSingle'({ name, year, month }) {
    Statuses.remove({ name, year, month });
  }
});
