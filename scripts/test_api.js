async function run() {
  console.log("Testing API...");
  try {
    const resSetup = await fetch('http://localhost:3000/api/setup_transfers');
    console.log("Setup response:", await resSetup.text());
    
    const resNotif = await fetch('http://localhost:3000/api/notifications?emp_id=admin');
    console.log("Notif response:", await resNotif.text());
  } catch (e) {
    console.error(e);
  }
}
run();
