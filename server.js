const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;
const itemsRoutes = require('./routes/index');

app.use(express.json());
app.use('/', itemsRoutes);
app.get('/', (req, res) => {
  res.send('Its workng');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
