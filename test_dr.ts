async function test() {
  const resp = await fetch('http://localhost:3000/api?action=getInitialData&user=Moh.%20Abu%20Amar');
  const res = await resp.json();
  console.log("Channels:", res.data.channels.length);
  console.log("WorkingData:", res.data.workingData.length);
  console.log("DR Sales:", res.data.drSalesData.length);
  
  if (res.data.workingData.length > 0) {
    const firstFew = res.data.workingData.slice(0, 3).map(w => w.pic);
    console.log("Some PICs in workingData:", firstFew);
  }
}
test();
