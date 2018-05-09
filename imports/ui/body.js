import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'
import { LOCALSTORAGE_KEY, STATUS_SIZE_PX_MARGIN } from '../constants';
import { Statuses} from "../data/status";
import './body.html';

function getName () {
  return Session.get(LOCALSTORAGE_KEY);
}

function setName (name) {
  Session.set(LOCALSTORAGE_KEY, name);
}

function removeName () {
  Session.set(LOCALSTORAGE_KEY, null);
}

function toggleOverlay () {
  $('#login-overlay').toggle();
}

function insertOrUpdateStatus (x, y) {
  const name = getName();
  const status = Statuses.findOne({name});
  if (status) {
    Meteor.call('statuses.update', {statusId: status._id, x, y});
  } else {
    Meteor.call('statuses.insert', {name, x, y});
  }
}

function removeAllStatuses () {
  Meteor.call('statuses.removeAll');
}

function calculatePercentage (which, from) {
  return Math.round((which - STATUS_SIZE_PX_MARGIN) / from * 100 );
}


Template.canvas.helpers({
  statuses() {
    return Statuses.find({});
  }
});

Template.canvas.events({
  'click, touchstart #canvas': function (event, template) {
    const canvasRects = template.find('#canvas').getClientRects()[0];
    const mouseXOnCanvas = event.clientX - canvasRects.left;
    const mouseYOnCanvas = event.clientY - canvasRects.top;
    const percentageOnCanvasX = calculatePercentage(mouseXOnCanvas, canvasRects.width);
    const percentageOnCanvasY = calculatePercentage(mouseYOnCanvas, canvasRects.height);
    insertOrUpdateStatus(percentageOnCanvasX, percentageOnCanvasY);
  }
});


Template.title.helpers({
  name() {
    return getName()
  },
  isAdmin() {
    return getName() === 'admin';
  }
});

Template.title.events({
  'click #reset': function () {
    removeName();
    toggleOverlay();
  },
  'click #reset-all': function () {
    removeAllStatuses();
  }
});

Template.login.onRendered(function () {
  if (!getName()) {
    toggleOverlay();
  }
});

Template.login.events({
  'submit #login': function (event) {
    event.preventDefault();
    setName($('#name').val().trim());
    toggleOverlay();
  }
});