const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Validaciones para Registro
const validateRegister = [
    check('email').isEmail().withMessage('Debe ser un email válido.'),
    check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    check('username').notEmpty().withMessage('El nombre de usuario es obligatorio.')
];

// Validaciones para Actualizar Perfil
const validateUpdateProfile = [
    check('username').optional().notEmpty().withMessage('El username no puede estar vacío.'),
    check('avatar').optional().isURL().withMessage('El avatar debe ser una URL válida.')
];

const handleErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

module.exports = (db) => {
    const isUsernameTaken = async (username, excludeUserId = null) => {
        let query = db.collection('users').where('username', '==', username);
        const snapshot = await query.get();

        if (snapshot.empty) return false;

        if (excludeUserId) {
            const doc = snapshot.docs[0];
            return doc.id !== excludeUserId;
        }
        return true;
    };

    // ------------------------------------------------------------------------------------------

    // POST /api/auth/register
    router.post('/register', validateRegister, handleErrors, async (req, res) => {
        try {
            const { email, password, username, avatar } = req.body;

            const emailQuery = await db.collection('users').where('email', '==', email).get();
            if (!emailQuery.empty) {
                return res.status(400).json({ error: 'El email ya está registrado.' });
            }

            if (await isUsernameTaken(username)) {
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
            }

            const newUser = {
                email,
                password,
                username,
                avatar: avatar || null,
                createdAt: new Date().toISOString()
            };

            const docRef = await db.collection('users').add(newUser);

            res.status(201).json({ id: docRef.id, ...newUser });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // POST /api/auth/login
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const userQuery = await db.collection('users')
                .where('email', '==', email)
                .where('password', '==', password)
                .get();

            if (userQuery.empty) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();

            res.json({ id: userDoc.id, ...userData });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ------------------------------------------------------------------------------------------

    // PUT /api/auth/profile/:id - Actualizar Perfil y propagar cambios a Recetas
    router.put('/profile/:id', validateUpdateProfile, handleErrors, async (req, res) => {
        try {
            const { id } = req.params;
            const { username, avatar } = req.body;

            const userRef = db.collection('users').doc(id);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const oldUserData = userDoc.data();
            if (username && username !== oldUserData.username) {
                if (await isUsernameTaken(username, id)) {
                    return res.status(400).json({ error: 'El nombre de usuario ya está ocupado.' });
                }
            }

            const updates = {};
            if (username) updates.username = username;
            if (avatar) updates.avatar = avatar;

            if (Object.keys(updates).length === 0) {
                return res.json({ message: 'Nada que actualizar' });
            }
            const batch = db.batch();

            batch.update(userRef, updates);


            if (username || avatar) {
                const recipesQuery = await db.collection('recipes')
                    .where('autor.nombre', '==', oldUserData.username)
                    .get();
                recipesQuery.forEach(doc => {
                    const recipeRef = db.collection('recipes').doc(doc.id);
                    const updateData = {};
                    if (username) updateData['autor.nombre'] = username;
                    if (avatar) updateData['autor.avatar'] = avatar;

                    batch.update(recipeRef, updateData);
                });
            }

            await batch.commit();

            // --- FIN ---

            res.json({ message: 'Perfil y recetas actualizados correctamente', id, ...updates });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};