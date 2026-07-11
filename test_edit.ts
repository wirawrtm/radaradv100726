async function test() {
  const resp = await fetch('http://localhost:3000/api', {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "updatePartner",
      id: 2,
      pic: "TEST",
      name: "TEST KIOSK",
      category: "R1",
      user: "Moh. Abu Amar"
    })
  });
  console.log(await resp.text());
}
test();
