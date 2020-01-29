import { Meteor } from 'meteor/meteor';
import { Statuses } from '../imports/data/status';

const { sheetGet, sheetUpdate } = require('./google-client');

Meteor.methods({
  sheetsExport({ fromClick }) {
    if (fromClick) {
      return updateSheet();
    } else {
      console.log('not from click');
    }
  }
});

function previousMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return {
    year: month === 1 ? year - 1 : year,
    month: month === 1 ? 12 : month - 1,
  };
}

const params = {
  spreadsheetId: '1sfuJQTArwo-duozZrfWguIrwa-PeC-ZDdC-dyCiY8l8',
  range: 'Happiness',
};

async function updateSheet() {
  try {
    const { year, month } = previousMonth();

    console.log('Exporting to Sheets');
    const statuses = Statuses.find({
      year,
      month,
    });
    const sheet = await sheetGet(params);
    const { data: { values } } = sheet;
    if (!values || !values.length) {
      console.error('No previous sheet data found.');
      throw new Error('No previous sheet data found.');
    }

    const curCol = values[0].length;
    const keys = values.map(row => row[0]);

    statuses.map(({ name, x, y }) => {
      let idx = keys.findIndex(cur => cur.toLowerCase().startsWith(name.toLowerCase() + '-'));
      if (idx === -1) {
        idx = keys.length;
        keys.push(name + '-x');
        keys.push(name + '-y');
        values[idx] = [];
        values[idx][0] = name + '-x';
        values[idx + 1] = [];
        values[idx + 1][0] = name + '-y';
      }
      values[idx][curCol] = x;
      values[idx + 1][curCol] = y;
    });
    values[0][curCol] = `${year}-${('0' + month).slice(-2)}`;

    const res = await sheetUpdate({
      ...params,
      resource: { values },
      valueInputOption: 'USER_ENTERED',
    });
  } catch (e) {
    console.error(e);
    throw new Meteor.Error(500, e.message);
  }

  return { success: 'yeah' };
}
