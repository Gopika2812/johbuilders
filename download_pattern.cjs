const https = require('https');
const fs = require('fs');

const url = 'https://www.transparenttextures.com/patterns/arabesque.png';
const file = fs.createWriteStream('client/public/pattern.png');

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Download completed');
    });
  });
}).on('error', function(err) {
  fs.unlink('client/public/pattern.png');
  console.log('Error downloading file: ' + err.message);
});
