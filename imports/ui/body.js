import { Template } from 'meteor/templating';
import { LOCALSTORAGE_KEY, STATUS_SIZE_PX_MARGIN } from '../constants';
import { Statuses} from "../data/status";
import './body.html';

const localStorage = window.localStorage;
const isAdmin = window.location.pathname.startsWith('/admin');
const showAll = window.location.pathname.startsWith('/all');

function getName () {
  return localStorage.getItem(LOCALSTORAGE_KEY);
}

function setName (name) {
  name && localStorage.setItem(LOCALSTORAGE_KEY, name);
}

function removeName () {
  localStorage.setItem(LOCALSTORAGE_KEY, null);
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

function removeSingleStatus(name) {
  Meteor.call('statuses.removeSingle', { name });
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
  insertOrUpdateStatus(percentageOnCanvasX, 100 - percentageOnCanvasY);
}

Template.canvas.helpers({
  statuses() {
    const name = getName();
    const acc = [];
    Statuses.find({}).map(cur => {
      if (showAll || isAdmin || name === cur.name) {
        cur.y = 100 - cur.y;
        acc.push(cur);
      }
    });
    return acc
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
    return isAdmin;
  }
});

Template.title.events({
  'click #reset': function () {
    const name = getName();
    removeSingleStatus(name);
    removeName();
    toggleOverlay();
  },
  'click #reset-all': function () {
    removeAllStatuses();
  },
  'click #export-all': function() {
    Meteor.call('sheetsExport', { fromClick: true }, (error, result) => {
      if (error) {
        console.error(error, result);
        alert('Something went terribly wrong');
        return;
      }
      console.log(result);
      alert('Google sheet updated with last months data!')
    });
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
    const name = $('#name').val().trim().toLowerCase();
    if (!name) {
      return;
    }
    setName(name);
    toggleOverlay();
  }
});
