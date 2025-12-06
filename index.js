const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const serviceAccount = require('./config/api-cocinaalrescate-firebase-adminsdk-fbsvc-f586d7a56e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());


// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Api Cocina al Rescate');
});

const authRoutes = require('./routes/authRoutes')(db);
const recipeRoutes = require('./routes/recipeRoutes')(db);

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});