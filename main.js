// monkey-patch Date
Date.prototype.getWeek = function() {
    const onejan = new Date(this.getFullYear(),0,1);
    const millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) / millisecsInDay) + onejan.getDay()+1)/7);
};

const info = id => `https://ith.port.ac.uk/public/app/global/php/users/profile.php?id=${id}`; // 242
const timesheet = id => `https://ith.port.ac.uk/public/app/rota-rebuild/php/myShifts.php?input1=${(new Date().getWeek()) + 25}&token=${id}` // 65; 242

const userInput = document.querySelector('.username-input');
const populateButton = document.getElementById('populate');

const getjson = (...args) => fetch(...args).then(r => r.json());

async function getData() {
  const { value } = userInput;
  const infoUrl = info(value);
  const shiftUrl = timesheet(value);
  const [userinfo, usershifts] = await Promise.all([getjson(infoUrl), getjson(shiftUrl)]);
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
  const lastDay = new Date(now.setDate(now.getDate() - now.getDay()+6));
  weekEnding.textContent = lastDay.toLocaleDateString();
}

const h = (elem, content) => {
  const newElem = document.createElement(elem);
  if (content) newElem.textContent = content;
  return newElem;
}

function populateDays(shifts) {
  console.log(shifts);
  const body = document.querySelector('tbody');
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
    // create new elements
    const row = h('tr');
    const desc = h('td');
    const dayCell = h('td', day.slice(0, 3).toUpperCase());
    const from = h('td');
    const to = h('td');
    const total = h('td');


    if (day in shifts) {
      console.log(shifts[day]);
      shifts[day].forEach(shift => {
        const descS = h('span', `ITH - ${shift.long_name}`);
        const fromS = h('span', shift.start_time);
        const toS = h('span', shift.end_time);
        const totalS = h('span', shift.gross);
        desc.appendChild(descS);
        from.appendChild(fromS);
        to.appendChild(toS);
        total.appendChild(totalS);
        
        console.log(shift);
      });
    }



    // insert in to DOM
    [desc, dayCell, from, to, total].forEach(cell => row.appendChild(cell));
    body.appendChild(row);
  });
}

populateButton.addEventListener('click', getData);
