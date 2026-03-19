import fs from 'fs';
fetch('http://localhost:5000/api/products/69bb7c70901cbf12ce4c2a70')
  .then(r => r.json())
  .then(d => {
    fs.writeFileSync('out3.json', JSON.stringify(d, null, 2));
    process.exit(0);
  })
  .catch(e => {
    fs.writeFileSync('out3.json', JSON.stringify({error: e.message}));
    process.exit(1);
  });
