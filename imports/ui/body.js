import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { LOCALSTORAGE_KEY, STATUS_SIZE_PX_MARGIN } from '../constants';
import { Statuses } from '../data/status';
import './body.html';

const { localStorage } = window;
const isAdmin = window.location.pathname.startsWith('/admin');
const showAll = window.location.pathname.startsWith('/all');

function getName() {
  return Session.get('name');
}

function loadName() {
  return localStorage.getItem(LOCALSTORAGE_KEY);
}

function setName(name) {
  if (name) {
    Session.set('name', name);
  }
}

function saveName(name) {
  if (name) {
    localStorage.setItem(LOCALSTORAGE_KEY, name);
  }
}

function removeName() {
  Session.set('name', undefined);
  delete Session.keys.name;

  localStorage.setItem(LOCALSTORAGE_KEY, null);
}

function getYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return { year, month };
}

function getPreviousYearMonth() {
  const { month, year } = getYearMonth();

  return {
    year: month === 1 ? year - 1 : year,
    month: month === 1 ? 12 : month - 1,
  };
}

function isStatusInMonth(status, monthFunc) {
  const { month, year } = monthFunc();

  return status.year === year && status.month === month;
}

function toggleOverlay() {
  $('#login-overlay').toggle();
}

function insertOrUpdateStatus(name, year, month, x, y) {
  const status = Statuses.findOne({ name, year, month });

  if (status) {
    Meteor.call('statuses.update', { statusId: status._id, x, y });
  } else {
    Meteor.call('statuses.insert', { name, year, month, x, y });
  }
}

function removeSingleStatus(name, year, month) {
  Meteor.call('statuses.removeSingle', { name, year, month });
}

function calculatePercentage(which, from) {
  return Math.round((which - STATUS_SIZE_PX_MARGIN) / from * 100);
}

function handleClick(x, y, template) {
  const name = getName();
  const { month, year } = getYearMonth();

  const canvasRects = template.find('#canvas').getClientRects()[0];
  const mouseXOnCanvas = x - canvasRects.left;
  const mouseYOnCanvas = y - canvasRects.top;
  const percentageOnCanvasX = calculatePercentage(mouseXOnCanvas, canvasRects.width);
  const percentageOnCanvasY = calculatePercentage(mouseYOnCanvas, canvasRects.height);

  insertOrUpdateStatus(name, year, month, percentageOnCanvasX, 100 - percentageOnCanvasY);
}

Template.canvas.onCreated(function () {
  this.subscribe('statuses');
  this.canvasWidth = new ReactiveVar(0);
  this.canvasHeight = new ReactiveVar(0);
});

Template.canvas.onRendered(function () {
  const templateInstance = this;

  templateInstance.autorun(() => {
    templateInstance.canvasWidth.set(templateInstance.$('#canvas').width());
    templateInstance.canvasHeight.set(templateInstance.$('#canvas').height());
  });

  $(window).resize(() => {
    templateInstance.canvasWidth.set(templateInstance.$('#canvas').width());
    templateInstance.canvasHeight.set(templateInstance.$('#canvas').height());
  });
});

Template.canvas.helpers({
  canvasWidth: function () {
    return Template.instance().canvasWidth.get();
  },
  canvasHeight: function () {
    return Template.instance().canvasHeight.get();
  },
  statuses() {
    const name = getName();
    const { month, year } = getYearMonth();
    const { month: prevMonth, year: prevYear } = getPreviousYearMonth();

    const statusesByName = {};
    const cursor = Statuses.find({
      $or: [
        {
          year: year,
          month: month,
        },
        {
          year: prevYear,
          month: prevMonth,
        },
      ]
    });

    cursor.map(cur => {
      if (showAll || isAdmin || name === cur.name) {
        cur.y = 100 - cur.y;

        if (!(cur.name in statusesByName)) {
          statusesByName[cur.name] = {
            name: cur.name,
            x: null,
            y: null,
            prevX: null,
            prevY: null,
          }
        }

        if (isStatusInMonth(cur, getYearMonth)) {
          statusesByName[cur.name].x = cur.x;
          statusesByName[cur.name].y = cur.y;
        } else if (isStatusInMonth(cur, getPreviousYearMonth)) {
          statusesByName[cur.name].prevX = cur.x;
          statusesByName[cur.name].prevY = cur.y;
        }
      }
    });

    return Object.values(statusesByName);
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

Template.status.helpers({
  getX() {
    const templateInstance = Template.instance();
    const canvasWidth = templateInstance.data.canvasWidth;
    const item = templateInstance.data.item;

    return canvasWidth / 100 * item.x;
  },
  getY() {
    const templateInstance = Template.instance();
    const canvasHeight = templateInstance.data.canvasHeight;
    const item = templateInstance.data.item;

    return canvasHeight / 100 * item.y;
  },
  getPrevX() {
    const templateInstance = Template.instance();
    const canvasWidth = templateInstance.data.canvasWidth;
    const item = templateInstance.data.item;

    return canvasWidth / 100 * item.prevX;
  },
  getPrevY() {
    const templateInstance = Template.instance();
    const canvasHeight = templateInstance.data.canvasHeight;
    const item = templateInstance.data.item;

    return canvasHeight / 100 * item.prevY;
  },
});

Template.statusArrow.helpers({
  shouldDraw() {
    const item = Template.instance().data.item;

    return item.x && item.prevX && item.y && item.prevY;
  },
  getLineCoordinates() {
    const templateInstance = Template.instance();
    const canvasWidth = templateInstance.data.canvasWidth;
    const canvasHeight = templateInstance.data.canvasHeight;
    const item = templateInstance.data.item;

    const radius = 30;
    let sourceX = canvasWidth / 100 * item.prevX;
    let sourceY = canvasHeight / 100 * item.prevY;
    let targetX = canvasWidth / 100 * item.x;
    let targetY = canvasHeight / 100 * item.y;

    sourceX += radius;
    sourceY += radius;
    targetX += radius;
    targetY += radius;

    const length = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));

    if (length > 75) {
      // from: https://stackoverflow.com/a/26616564/598781
      const theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
      const phi = Math.atan((targetY - sourceY) / (targetX - sourceX));

      const sinTheta = radius * Math.sin(theta);
      const cosTheta = radius * Math.cos(theta);
      const sinPhi = radius * Math.sin(phi);
      const cosPhi = radius * Math.cos(phi);

      // Set the position of the link's end point at the source node
      // such that it is on the edge closest to the target node
      if (targetY > sourceY || targetY === sourceY) {
        sourceX += sinTheta;
        sourceY += cosTheta;
      } else {
        sourceX -= sinTheta;
        sourceY -= cosTheta;
      }

      // Set the position of the link's end point at the target node
      // such that it is on the edge closest to the source node
      if (sourceX > targetX) {
        targetX += cosPhi;
        targetY += sinPhi;
      } else {
        targetX -= cosPhi;
        targetY -= sinPhi;
      }
    }

    return {
      x1: sourceX,
      y1: sourceY,
      x2: targetX,
      y2: targetY,
    };
  },
});

Template.title.helpers({
  name() {
    return getName();
  },
  isAdmin() {
    return isAdmin;
  },
});

Template.title.events({
  'click #reset': function () {
    const name = getName();
    const { month, year } = getYearMonth();

    removeSingleStatus(name, year, month);
    removeName();
    toggleOverlay();
  },
  'click #export-all': function () {
    Meteor.call('sheetsExport', { fromClick: true }, (error, result) => {
      if (error) {
        console.error(error, result);
        alert('Something went terribly wrong');
        return;
      }
      console.log(result);
      alert('Google sheet updated with last months data!');
    });
  },
});

Template.login.onRendered(function () {
  if (getName()) {
    return;
  }

  const savedName = loadName();

  if (!savedName) {
    toggleOverlay();
    this.find('#name').focus();
  } else {
    setName(savedName);
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
    saveName(name);
    toggleOverlay();
  },
});
