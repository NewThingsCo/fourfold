import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Statuses = new Mongo.Collection('statuses');

Meteor.methods({
  'statuses.insert'({name, x, y}) {
    check(name, String);
    check(x, Number);
    check(y, Number);

    Statuses.insert({name, x, y});
  },
  'statuses.update'({statusId, x, y}) {
    check(statusId, String);
    check(x, Number);
    check(y, Number);

    Statuses.update(statusId, {$set: {x, y}});
  },
  'statuses.removeAll'() {
    Statuses.remove({});
  },
  'statuses.removeSingle'({ name }) {
    Statuses.remove({ name });
  }
});
