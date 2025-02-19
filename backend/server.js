const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
app.use((req, res, next) => {
  const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.example.com; style-src 'self' 'unsafe-inline' cdn.example.com; img-src 'self' data: cdn.example.com; connect-src 'self'; font-src 'self' cdn.example.com;";

  res.set({
    'Content-Security-Policy': cspHeader,
    'X-Frame-Options': 'DENY',
    'frame-ancestors': "'none'"
  });

  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use('/weather', require('./Route/weather'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('json')) {
    res.json({ "error": "404 Not Found" });
  } else {
    res.type('txt').send("404 Not Found");
  }
});

app.listen(5001, () => {
  console.log(`Listening on port 5001`);
});