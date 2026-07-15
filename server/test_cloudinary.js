const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dgo9lfoyd', 
  api_key: '545114389335888', 
  api_secret: 'JDu3bVTfdUR1RSNUlvEUQ4k2suk' 
});

cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", { folder: "test" })
  .then(res => console.log("Success:", res.secure_url))
  .catch(err => console.error("Error:", err));
