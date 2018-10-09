// monkey-patch Date
Date.prototype.getWeek = function() {
    const onejan = new Date(this.getFullYear(),0,1);
    const millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) / millisecsInDay) + onejan.getDay()+1)/7);
};

const userInfo = 'https://ith.port.ac.uk/public/php/personal-message/recipients.php';

const info = id => `https://ith.port.ac.uk/public/app/global/php/users/profile.php?id=${id}`;
const timesheet = (id, week) => `https://ith.port.ac.uk/public/app/rota-rebuild/php/myShifts.php?input1=${parseInt(week, 10) + 25}&token=${id}`;

const userInput = document.querySelector('.username-input');
const users = document.getElementById('user-dropdown');
const dates = document.getElementById('dates');
const populateButton = document.getElementById('populate');

users.addEventListener('change', getData);
dates.addEventListener('change', getData);
const getjson = (...args) => fetch(...args).then(r => r.json());

function h(elem, content) {
  const newElem = document.createElement(elem);
  if (content && typeof content !== 'string') newElem.innerHTML = getHTML(content);
  else newElem.innerHTML = content || '';
  return newElem;
}

async function populateSelect() {
  const usersInfo = await getjson(userInfo);
  usersInfo.forEach(user => {
    const opt = h('option', `${user.preferred} ${user.last_name}`);
    opt.value = user.user_id;
    users.appendChild(opt);
  });
}

async function getData() {
  const id = users.value;
  const date = dates.value;
  const infoUrl = info(id);
  const shiftUrl = timesheet(id, date);
  console.log('info:', infoUrl);
  console.log('shift:', shiftUrl);
  const [userinfo, usershifts] = await Promise.all([getjson(infoUrl), getjson(shiftUrl)]);
  console.log(userinfo);
  console.log(usershifts);
  const normalShifts = normaliseShifts(usershifts);
  populateDetails(userinfo);
  populateDays(normalShifts);
}

const normaliseShifts = shifts => Object.values(shifts.content).reduce((acc, entry) => {
    if (!(entry.day in acc)) acc[entry.day] = [entry];
    else acc[entry.day].push(entry);
    return acc;
  }, {});

function populateDetails({ user }) {
  const surname = document.querySelector('.timesheet-details__surname_field');
  const forename = document.querySelector('.timesheet-details__forename_field');
  const payroll = document.querySelector('.timesheet-details__payroll_field');
  const weekEnding = document.querySelector('.timesheet-details__date_field');
  surname.textContent = user.last_name;
  forename.textContent = user.first_name;
  payroll.textContent = user.payroll;

  const now = new Date;
  now.setDate(dates.value * 7);
  const lastDay = new Date(now.setDate(now.getDate() - now.getDay()+6));
  weekEnding.textContent = lastDay.toLocaleDateString();
}

function getHTML(node) {
  const tempContainer = h('div');
  tempContainer.appendChild(node);
  return tempContainer.innerHTML;
}

function populateDays(shifts) {
  const totalWorked = [];
  console.log(shifts);
  const body = document.querySelector('tbody');
  body.innerHTML = '';
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
    // create new elements
    const row = h('tr');
    const desc = h('td');
    const dayCell = h('td', day.slice(0, 3).toUpperCase());
    const from = h('td');
    const to = h('td');
    const total = h('td');


    if (day in shifts) {
      shifts[day].forEach(shift => {
        const descS = h('span', `ITH - ${shift.long_name}`);
        const fromS = h('span', shift.start_time);
        const toS = h('span', shift.end_time);
        const totalS = h('span', shift.gross);
        desc.appendChild(descS);
        from.appendChild(fromS);
        to.appendChild(toS);
        total.appendChild(totalS);
        totalWorked.push(shift.gross);
      });
    }

    // insert in to DOM
    [desc, dayCell, from, to, total].forEach(cell => row.appendChild(cell));
    body.appendChild(row);
  });
  const totalHours = totalWorked.reduce((acc, gross) => {
    const [hour, minute, seconds] = gross.split(':').map(num => parseInt(num, 10));
    acc += hour;
    acc += minute / 60;
    acc += seconds / (60 * 60);
    return acc;
  }, 0).toFixed(2);
    const row = h('tr');
    const hours =  h('div', `Total Hours worked: ${totalHours}`);
    const pay = h('div', `Total Pay: £${~~(totalHours * 8.8)}`);
    row.appendChild(hours);
    row.appendChild(pay);
    body.appendChild(row);
}

function populateWeeks() {
  // in to the trash
  for (let i = 1; i < 52; i++) {
      const now = new Date(2018, 0, 1);
      now.setDate(i * 7);
      const opt = h('option', now.toLocaleDateString());
      opt.value = i;
      dates.appendChild(opt);
  }
  const nearest = dates.querySelector(`[value='${new Date().getWeek()}']`);
  dates.selectedIndex = new Date().getWeek() - 1;
}

function main() {
  populateWeeks();
  populateSelect();
}

window.onload = main;
