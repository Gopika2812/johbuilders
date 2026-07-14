const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '6a53d092bd445a32abd8bcdf', name: 'Super Admin', role: 'Super Admin' }, 'merun_glacier_secret_key_12345', { expiresIn: '1d' });
console.log(token);
