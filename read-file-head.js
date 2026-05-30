const fs = require('fs');
const content = fs.readFileSync('mng_admin_boundaries.xlsx', 'utf8');
console.log(content.slice(0, 1000));
