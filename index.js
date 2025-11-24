// 1. Importaciones
const express = require('express');
const cors = require('cors');

// 2. Inicialización
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares
// express.json() permite al servidor entender peticiones con body en formato JSON
app.use(express.json());
// cors() permite que nuestra API reciba peticiones desde otros orígenes (dominios)
app.use(cors());

// 4. "Base de Datos" en Memoria
// Para este ejemplo, usaremos un array. En un proyecto real, esto sería una base de datos.
let productos = [
  { id: 1, nombre: "Laptop Dell XPS 15", precio: 1899.99 },
  { id: 2, nombre: "Teclado Mecánico Keychron", precio: 150.00 },
  { id: 3, nombre: "Mouse Logitech MX Master 3", precio: 99.50 }
];

// Un contador simple para simular IDs auto-incrementales
let nextId = 4;

// 5. Definición de Rutas (Endpoints)

// --- Endpoint de Bienvenida (GET /) ---
app.get('/', (req, res) => {
  res.send('API de Productos v1.0');
});

// --- Endpoint para LEER TODOS los productos (READ) ---
// MÉTODO: GET
// ENDPOINT: /productos
app.get('/productos', (req, res) => {
  // Simplemente devolvemos el array completo de productos
  res.json(productos);
});

// --- Endpoint para LEER UN PRODUCTO por ID (READ) ---
// MÉTODO: GET
// ENDPOINT: /productos/:id (ej: /productos/1)
app.get('/productos/:id', (req, res) => {
  // Obtenemos el ID de los parámetros de la URL (req.params)
  const id = parseInt(req.params.id);
  // Buscamos el producto en el array
  const producto = productos.find(p => p.id === id);

  if (producto) {
    res.json(producto);
  } else {
    // Si no se encuentra, devolvemos un código 404 (Not Found)
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

// --- Endpoint para CREAR un nuevo producto (CREATE) ---
// MÉTODO: POST
// ENDPOINT: /productos
app.post('/productos', (req, res) => {
  // Los datos del nuevo producto vienen en el "body" de la petición
  const { nombre, precio } = req.body;

  // Creamos el nuevo objeto producto
  const nuevoProducto = {
    id: nextId++,
    nombre: nombre,
    precio: parseFloat(precio) // Aseguramos que el precio sea un número
  };

  // Añadimos el producto a nuestro array
  productos.push(nuevoProducto);
  
  // Devolvemos un código 201 (Created) y el producto recién creado
  res.status(201).json(nuevoProducto);
});

// --- Endpoint para ACTUALIZAR un producto (UPDATE) ---
// MÉTODO: PUT
// ENDPOINT: /productos/:id
app.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, precio } = req.body;
  
  // Buscamos el índice del producto en el array
  const productoIndex = productos.findIndex(p => p.id === id);

  if (productoIndex !== -1) {
    // Si lo encontramos, actualizamos sus propiedades
    productos[productoIndex].nombre = nombre;
    productos[productoIndex].precio = parseFloat(precio);
    res.json(productos[productoIndex]); // Devolvemos el producto actualizado
  } else {
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

// --- Endpoint para BORRAR un producto (DELETE) ---
// MÉTODO: DELETE
// ENDPOINT: /productos/:id
app.delete('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productoIndex = productos.findIndex(p => p.id === id);

  if (productoIndex !== -1) {
    // Usamos splice para eliminar el producto del array
    productos.splice(productoIndex, 1);
    // Devolvemos un código 204 (No Content) que indica éxito sin devolver datos
    res.status(204).send();
  } else {
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo exitosamente en http://localhost:${PORT}`);
});