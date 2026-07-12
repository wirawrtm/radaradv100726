const http = require('http');

const data = JSON.stringify({
  action: "deletePartner",
  id: 1337,
  name: "Qqqq",
  pic: "Iing Mubarok",
  user: "Iing Mubarok"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api?action=deletePartner',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(data);
req.end();
