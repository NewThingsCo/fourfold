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

function handleClick (x, y, template) {
  const canvasRects = template.find('#canvas').getClientRects()[0];
  const mouseXOnCanvas = x - canvasRects.left;
  const mouseYOnCanvas = y - canvasRects.top;
  const percentageOnCanvasX = calculatePercentage(mouseXOnCanvas, canvasRects.width);
  const percentageOnCanvasY = calculatePercentage(mouseYOnCanvas, canvasRects.height);
  insertOrUpdateStatus(percentageOnCanvasX, percentageOnCanvasY);
}

Template.canvas.helpers({
  statuses() {
    return Statuses.find({});
  }
});

Template.canvas.events({
  'click #canvas': function (event, template) {
    const clickX = event.clientX;
    const clickY = event.clientY;
    handleClick(clickX, clickY, template);
  },
  'touchstart #canvas': function (event, template) {
    const touchX = event.originalEvent.touches[0].clientX;
    const touchY = event.originalEvent.touches[0].clientY;
    handleClick(touchX, touchY, template);
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