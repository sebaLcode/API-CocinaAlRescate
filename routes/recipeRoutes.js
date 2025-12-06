const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const validateRecipe = [
    check('titulo').isString().withMessage('El título debe ser un texto.')
        .notEmpty().withMessage('El título es obligatorio.'),
    check('descripcion').isString().withMessage('La descripción debe ser un texto.')
        .notEmpty().withMessage('La descripción es obligatoria.'),
    check('categoria').isString().withMessage('La categoría debe ser un texto.')
        .notEmpty().withMessage('La categoría es obligatoria.'),
    check('dificultad').isIn(['Fácil', 'Media', 'Difícil']).withMessage('La dificultad debe ser: Fácil, Media o Difícil.'),

    check('tiempoPreparacion').isString().withMessage('El tiempo debe ser un texto.')
        .notEmpty().withMessage('El tiempo es obligatorio.'),

    // check('imagen').optional().isURL().withMessage('La imagen debe ser una URL válida.'),
    check('imagen').optional().isString().withMessage('La imagen debe ser texto.'),

    // --- NUEVA VALIDACIÓN PARA AUTOR (OBJETO) ---
    check('autor.nombre').isString().withMessage('El nombre del autor debe ser un texto.')
        .notEmpty().withMessage('El nombre del autor es obligatorio.'),
    // check('autor.avatar').optional().isURL().withMessage('El avatar debe ser una URL válida.'),
    check('autor.avatar').optional().isString().withMessage('El avatar debe ser texto.'),
    // --------------------------------------------

    check('ingredientes').isArray().withMessage('Los ingredientes deben ser una lista.')
        .notEmpty().withMessage('Se requiere al menos un ingrediente.'),

    // Validamos que cada elemento dentro del array 'ingredientes' contenga 'nombre' y 'cantidad'
    check('ingredientes.*.nombre').isString().withMessage('El nombre del ingrediente debe ser un texto.')
        .notEmpty().withMessage('El nombre del ingrediente es obligatorio.'),
    check('ingredientes.*.cantidad').isString().withMessage('La cantidad del ingrediente debe ser un texto.')
        .notEmpty().withMessage('La cantidad del ingrediente es obligatoria.'),

    check('instrucciones').isArray().withMessage('Las instrucciones deben ser una lista de pasos.')
        .notEmpty().withMessage('Se requiere al menos un paso de instrucción.'),
    check('instrucciones.*').isString().withMessage('Cada instrucción debe ser un texto.')
        .notEmpty().withMessage('Las instrucciones no pueden estar vacías.'),

    check('porciones').isString().withMessage('Las porciones deben ser texto.')
        .notEmpty().withMessage('Las porciones son obligatorias.'),

    check('calificacion').optional().isFloat({ min: 0, max: 5 }).withMessage('La calificación debe ser un número entre 0 y 5.'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Error de validación:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};


module.exports = (db) => {

    // GET /api/recipes - Obtener todas las recetas
    router.get('/', async (req, res) => {
        try {
            const snapshot = await db.collection('recipes').get();
            const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(recipes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET /api/recipes/:id - Obtener una sola receta por su ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const doc = await db.collection('recipes').doc(id).get();

            // Verificamos si el documento realmente existe en Firestore
            if (!doc.exists) {
                return res.status(404).json({ error: 'Receta no encontrada' });
            }

            // Si existe, devolvemos los datos junto con el ID
            res.json({ id: doc.id, ...doc.data() });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --------------------------------------------------------------------------------------------------

    // POST /api/recipes - Crear una receta
    router.post('/', validateRecipe, handleValidationErrors, async (req, res) => {
        try {
            const newRecipe = { ...req.body };

            delete newRecipe.id; 

            const docRef = await db.collection('recipes').add(newRecipe);

            res.status(201).json({ id: docRef.id, ...newRecipe });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --------------------------------------------------------------------------------------------------

    // Validaciones para actualizar
    const validateUpdateRecipe = [
        check('titulo').optional().isString().withMessage('El título debe ser un texto.'),
        check('descripcion').optional().isString().withMessage('La descripción debe ser un texto.'),
        check('categoria').optional().isString().withMessage('La categoría debe ser un texto.'),
        check('dificultad').optional().isIn(['Fácil', 'Media', 'Difícil']).withMessage('La dificultad debe ser: Fácil, Media o Difícil.'),
        check('tiempoPreparacion').optional().isString().withMessage('El tiempo debe ser un texto.'),
        check('imagen').optional().isURL().withMessage('La imagen debe ser una URL válida.'),

        check('autor.nombre').optional().isString().withMessage('El nombre del autor debe ser un texto.'),
        check('autor.avatar').optional().isURL().withMessage('El avatar debe ser una URL válida.'),
        // ----------------------------------------------

        check('ingredientes').optional().isArray().withMessage('Los ingredientes deben ser una lista (array).'),
        check('instrucciones').optional().isArray().withMessage('Las instrucciones deben ser una lista (array) de pasos.')
    ];

    // PUT /api/recipes/:id - Actualizar una receta existente
    router.put('/:id', validateUpdateRecipe, handleValidationErrors, async (req, res) => {
        try {
            const { id } = req.params;
            const updatedData = req.body;

            if (Object.keys(updatedData).length === 0) {
                return res.status(400).json({ error: 'Se requiere al menos un campo para actualizar.' });
            }

            await db.collection('recipes').doc(id).update(updatedData);

            res.json({ message: 'Receta actualizada correctamente', id, ...updatedData });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --------------------------------------------------------------------------------------------------

    // DELETE /api/recipes/:id - Borrar receta
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('recipes').doc(req.params.id).delete();
            res.json({ message: 'Receta eliminada' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};