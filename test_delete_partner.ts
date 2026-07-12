async function test() {
  const resp = await fetch('http://localhost:3000/api', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'deletePartner',
      id: -1,
      name: 'PT. Tani Guna Mahakarya',
      user: 'Adityawiratama'
    })
  });
  const res = await resp.json();
  console.log(res);
}
test();
