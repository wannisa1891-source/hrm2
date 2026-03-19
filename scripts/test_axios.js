const axios = require('axios');
const fs = require('fs');

async function run() {
  try {
    const resSetup = await axios.get('http://localhost:3000/api/setup_transfers');
    fs.writeFileSync('api_res.txt', "Setup OK: " + JSON.stringify(resSetup.data));
  } catch(e) {
    fs.writeFileSync('api_res.txt', "Setup Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
  }

  try {
    const resNotif = await axios.get('http://localhost:3000/api/notifications?emp_id=admin');
    fs.appendFileSync('api_res.txt', "\nNotif OK: " + JSON.stringify(resNotif.data));
  } catch(e) {
    fs.appendFileSync('api_res.txt', "\nNotif Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
  }
}
run();
