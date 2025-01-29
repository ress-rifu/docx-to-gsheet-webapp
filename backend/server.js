const express = require('express');
const cors = require('cors');
const convertRoute = require('./routes/convert');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use('/api/convert', convertRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
