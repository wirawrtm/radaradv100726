async function test() {
  const resp = await fetch('http://localhost:3000/api?action=getChannels&user=Adityawiratama');
  const res = await resp.json();
  console.log(res.data[0]);
}
test();
