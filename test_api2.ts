async function test() {
  const resp = await fetch('http://localhost:3000/api?action=getInitialData&user=Adityawiratama');
  const res = await resp.json();
  console.log(res.data.accessRules);
}
test();
