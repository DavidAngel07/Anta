const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  // Agregamos JWT para manejo de sesión
require("dotenv").config(); // Para leer las variables de entorno desde un archivo .env
const app = express();

// Middlewares
app.use(cors({ origin: "https://anta-production.up.railway.app" }));
app.use(express.json());

// 🔗 Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'crossover.proxy.rlwy.net',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'PRyQrtojaQmbSELgrRirBkSFHMKGSQrq',
  database: process.env.MYSQL_DATABASE || 'anta',
  port: process.env.MYSQL_PORT || '24421',
});

db.connect((err) => {
  if (err) {
    console.error("❌Error conectando a la base de datos:", err);
    return;
  }
  console.log("✅Conectado a la base de datos MySQL en Railway");
});

module.exports = db;

// ✅ Ruta para registrar un usuario
app.post('/register', (req, res) => {
  const { nombre, correo, contraseña } = req.body;

  // Verificar si el correo ya existe
  db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
    if (err) {
      return res.status(500).send('Error al verificar el correo.');
    }

    if (results.length > 0) {
      return res.status(400).send('El correo ya está registrado.');
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    bcrypt.hash(contraseña, saltRounds, (err, hash) => {
      if (err) {
        return res.status(500).send('Error al encriptar la contraseña.');
      }

      // Insertar el usuario en la base de datos
      const sql = 'INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)';
      db.query(sql, [nombre, correo, hash], (err, result) => {
        if (err) {
          return res.status(500).send('Error al registrar el usuario.');
        }
        res.status(200).send('Usuario registrado exitosamente.');
      });
    });
  });
});

// ✅ Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;
  
    // Verificar si el correo existe en la base de datos
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
      if (err) {
        console.error('Error al buscar el correo:', err);
        return res.status(500).send('Error al buscar el correo.');
      }
  
      if (results.length === 0) {
        return res.status(400).send('Correo no registrado.');
      }
  
      // Comparar la contraseña ingresada con la almacenada
      bcrypt.compare(contraseña, results[0].contraseña, (err, isMatch) => {
        if (err) {
          console.error('Error al comparar la contraseña:', err);
          return res.status(500).send('Error al comparar la contraseña.');
        }
  
        if (!isMatch) {
          return res.status(400).send('Contraseña incorrecta.');
        }
  
        // Logueamos el estado del usuario
        console.log(`Usuario ${correo} ha iniciado sesión exitosamente.`);
  
        // Actualizamos el campo "online" a 1
        db.query('UPDATE usuarios SET online = 1 WHERE correo = ?', [correo], (err, result) => {
          if (err) {
            console.error('Error al actualizar estado online:', err);
            return res.status(500).send('Error al actualizar el estado online.');
          }
  
          // Verificamos si la actualización fue exitosa
          if (result.affectedRows === 0) {
            console.error(`No se pudo actualizar el estado online para el correo ${correo}.`);
            return res.status(500).send('No se pudo actualizar el estado online.');
          }
  
          console.log(`Estado online de ${correo} actualizado a 1.`);
          
          // Generar un token JWT para el usuario (si lo estás usando)
          const token = jwt.sign({ id: results[0].id }, 'tu_secreto', { expiresIn: '1h' });
  
          res.status(200).json({ message: 'Inicio de sesión exitoso.', token });
        });
      });
    });
  });
  

// ✅ Ruta para cerrar sesión
app.post('/logout', (req, res) => {
  const { correo } = req.body;

  // Cambiar el estado "online" a 0 cuando el usuario cierre sesión
  db.query('UPDATE usuarios SET online = 0 WHERE correo = ?', [correo], (err, result) => {
    if (err) {
      console.error('Error al actualizar el estado online:', err);
      return res.status(500).send('Error al actualizar el estado online.');
    }

    // Verificar si la actualización fue exitosa
    if (result.affectedRows === 0) {
      console.error(`No se pudo actualizar el estado online para el correo ${correo}.`);
      return res.status(500).send('No se pudo actualizar el estado online.');
    }

    // Mostrar en consola el resultado de la sesión cerrada
    console.log(`Usuario ${correo} ha cerrado sesión exitosamente.`);
    
    // Devolver respuesta
    res.status(200).send('Sesión cerrada exitosamente.');
  });
});

// ✅ Middleware para verificar si el usuario está online antes de acceder al Dashboard
const verificarSesion = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Obtener el token desde el header

  if (!token) {
    return res.status(403).json('No se ha proporcionado un token');
  }

  jwt.verify(token, 'tu_secreto', (err, decoded) => {
    if (err) {
      return res.status(401).json('Token inválido');
    }

    // Verificar que el usuario esté online en la base de datos
    db.query('SELECT online FROM usuarios WHERE id = ?', [decoded.id], (err, result) => {
      if (err) {
        return res.status(500).send('Error al verificar estado online.');
      }

      if (result.length === 0 || result[0].online === 0) {
        return res.status(403).json('No se puede acceder a la sesión');
      }

      req.user = decoded; // Poner el usuario en la solicitud
      next();
    });
  });
};

// ✅ Ruta protegida del Dashboard
app.get('/dashboard', verificarSesion, (req, res) => {
  res.status(200).send('Bienvenido al Dashboard');
});

// 🚀 Iniciar el servidor
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Ruta para obtener productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
      if (err) {
        return res.status(500).send('Error al obtener productos.');
      }
      res.status(200).json(results);  // Enviamos los productos como respuesta en formato JSON
    });
  });
  
// Ruta para agregar un nuevo producto
app.post('/productos', (req, res) => {
  const { producto, proveedor, cantidad, medida, precio, porcentaje } = req.body;

  // Validar los datos
  if (!producto || !proveedor || !cantidad || !medida || !precio || porcentaje === undefined) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  // Consulta SQL para insertar el producto
  const query = 'INSERT INTO productos (producto, proveedor, cantidad, medida, precio, porcentaje) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [producto, proveedor, cantidad, medida, precio, porcentaje], (err, result) => {
    if (err) {
      console.error('Error al agregar el producto:', err);
      return res.status(500).json({ success: false, message: 'Error al agregar el producto' });
    }
    res.status(200).json({ success: true, message: 'Producto agregado correctamente' });
  });
});

// Ruta para eliminar un producto
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;

  // Consulta SQL para eliminar el producto
  const query = 'DELETE FROM productos WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar el producto:', err);
      return res.status(500).json({ success: false, message: 'Error al eliminar el producto' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Producto eliminado correctamente' });
  });
});

// Ruta para actualizar un producto
app.put('/productos/:id', (req, res) => {
  const { id } = req.params; // Obtenemos el id del producto desde la URL
  const { producto, proveedor, cantidad, medida, precio, porcentaje } = req.body; // Obtenemos los datos actualizados del cuerpo de la solicitud

  // Validar que todos los campos sean proporcionados
  if (!producto || !proveedor || !cantidad || !medida || !precio || porcentaje === undefined) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  // Consulta SQL para actualizar el producto
  const query = 'UPDATE productos SET producto = ?, proveedor = ?, cantidad = ?, medida = ?, precio = ?, porcentaje = ? WHERE id = ?';
  db.query(query, [producto, proveedor, cantidad, medida, precio, porcentaje, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el producto:', err);
      return res.status(500).json({ success: false, message: 'Error al actualizar el producto' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Producto actualizado correctamente' });
  });
});

// Ruta para obtener productos
app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      return res.status(500).send('Error al obtener productos.');
    }
    res.status(200).json(results);  // Enviamos los productos como respuesta en formato JSON
  });
});

// Ruta para obtener los lotes
app.get('/api/lotes_cueros', (req, res) => {
  db.query('SELECT * FROM lotes_cueros', (err, results) => {
    if (err) {
      return res.status(500).send('Error al obtener los lotes.');
    }
    res.status(200).json(results);  // Enviar los lotes como respuesta en formato JSON
  });
});

// Ruta para obtener los procesos
app.get('/api/procesos', (req, res) => {
  db.query('SELECT nombre_proceso FROM procesos', (err, results) => {
    if (err) {
      return res.status(500).send('Error al obtener los procesos.');
    }
    res.status(200).json(results);  // Enviar los lotes como respuesta en formato JSON
  });
});

// Ruta para agregar un nuevo lote
app.post('/api/lotes_cueros', (req, res) => {
  const { tipo_cuero, cantidad, peso } = req.body;

  if (!tipo_cuero || !cantidad || !peso) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  // Obtener el primer proceso disponible con el nombre
  db.query('SELECT nombre_proceso FROM procesos ORDER BY orden ASC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error al obtener el primer proceso:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener el proceso inicial.' });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay procesos definidos.' });
    }

    const procesoInicial = results[0].nombre_proceso;  // Usar el nombre del proceso
    console.log('Proceso inicial seleccionado:', procesoInicial); // Verificar que sea el nombre del proceso

    // Insertar el lote con datos predeterminados
    const query = `
        INSERT INTO lotes_cueros (tipo_cuero, cantidad, fecha_creacion, peso, proceso_actual)
        VALUES (?, ?, NOW(), ?, ?)
    `;
    console.log('Consulta SQL:', query, [tipo_cuero, cantidad, peso, procesoInicial]); // Verificar la consulta

    db.query(query, [tipo_cuero, cantidad, peso, procesoInicial], (err, result) => {
      if (err) {
        console.error('Error al agregar el lote:', err);
        return res.status(500).json({ success: false, message: 'Error al agregar el lote.' });
      }

      // Obtener el lote recién creado con el nombre del proceso
      const responseData = {
        id: result.insertId,
        tipo_cuero,
        cantidad,
        fecha_creacion: new Date(),
        peso,
        proceso_actual: procesoInicial, // Aquí se devuelve el nombre del proceso
      };

      // Responder con éxito incluyendo el nombre del proceso
      return res.status(200).json({
        success: true,
        message: 'Lote agregado correctamente',
        lote: responseData,
      });
    });
  });
});

app.get('/api/lotes_cueros/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM lotes_cueros WHERE id = ?', [id], (err, result) => {
      if (err) {
          return res.status(500).send('Error al obtener el lote.');
      }
      if (result.length === 0) {
          return res.status(404).send('Lote no encontrado.');
      }
      res.status(200).json(result[0]);
  });
});
