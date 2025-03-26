const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
app.use(express.json());
const URL_BACK = process.env.URL_BACK;

const corsOptions = {
  origin: [
    "https://anta-system.up.railway.app",
    "http://localhost:3000"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));


// 🔗 Configuración del pool de conexiones

const db = mysql.createPool({
  host: process.env.MYSQLHOST || 'mysql.railway.internal',  
  user: process.env.MYSQLUSER || 'root', 
  password: process.env.MYSQLPASSWORD || '',  
  database: process.env.MYSQLDATABASE || 'railway',  
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // ⏳ Espera 10 segundos antes de dar error
});

// Probar conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err);
    process.exit(1); // Salir si hay un error de conexión
  } else {
    console.log("✅ Conexión exitosa a la base de datos");
    connection.release();
  }
});

const dbPromise = db.promise();
module.exports = dbPromise;

// Rutas
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001; // Usar el puerto de la variable de entorno

app.listen(PORT, () => {
  console.log(`Servidor corriendo en htttps://anta-backend.up.railway.app`);
});

// ✅ Ruta para registrarse
app.post("/register", async (req, res) => {
  const { nombre, correo, contraseña } = req.body;
  console.log("📩 Recibiendo solicitud de registro:", req.body);

  try {
    const [results] = await dbPromise.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);

    if (results.length > 0) {
      return res.status(400).json("El correo ya está registrado.");
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(contraseña, saltRounds);

    await dbPromise.query("INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)", [nombre, correo, hash]);

    console.log("✅ Usuario registrado con éxito.");
    res.status(200).json("Usuario registrado exitosamente.");
  } catch (error) {
    console.error("❌ Error en el registro:", error);
    res.status(500).json("Error al registrar el usuario.");
  }
});

// ✅ Ruta para iniciar sesión
app.post("/login", (req, res) => {
  console.log("📩 Datos recibidos en /login:", req.body);
  console.log(req.body); // <---- Agregar esta línea

  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    console.log("❌ Faltan datos en la solicitud de login.");
    return res.status(400).json("Faltan datos en la solicitud.");
  }

  // Verificar si el correo existe en la base de datos
  db.query(
    "SELECT * FROM usuarios WHERE correo = ?",
    [correo],
    (err, results) => {
      if (err) {
        console.error("Error al buscar el correo:", err);
        return res.status(500).json("Error al buscar el correo.");
      }

      if (results.length === 0) {
        return res.status(400).json("Correo no registrado.");
      }

      // Comparar la contraseña ingresada con la almacenada
      bcrypt.compare(contraseña, results[0].contraseña, (err, isMatch) => {
        if (err) {
          console.error("Error al comparar la contraseña:", err);
          return res.status(500).json("Error al comparar la contraseña.");
        }

        if (!isMatch) {
          return res.status(400).json("Contraseña incorrecta.");
        }

        // Logueamos el estado del usuario
        console.log(`Usuario ${correo} ha iniciado sesión exitosamente.`);

        // Actualizamos el campo "online" a 1
        db.query(
          "UPDATE usuarios SET online = 1 WHERE correo = ?",
          [correo],
          (err, result) => {
            if (err) {
              console.error("Error al actualizar estado online:", err);
              return res
                .status(500)
                .json("Error al actualizar el estado online.");
            }

            // Verificamos si la actualización fue exitosa
            if (result.affectedRows === 0) {
              console.error(
                `No se pudo actualizar el estado online para el correo ${correo}.`
              );
              return res
                .status(500)
                .json("No se pudo actualizar el estado online.");
            }

            console.log(`Estado online de ${correo} actualizado a 1.`);

            // Generar un token JWT para el usuario (si lo estás usando)
            const token = jwt.sign({ id: results[0].id }, "tu_secreto", {
              expiresIn: "1h",
            });

            res
              .status(200)
              .json({ message: "Inicio de sesión exitoso.", token });
          }
        );
      });
    }
  );
});

// ✅ Ruta para cerrar sesión
app.post("/logout", (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json("Correo no proporcionado.");
  }

  console.log(`📩 Recibida solicitud de logout para: ${correo}`);

  const sql = "UPDATE usuarios SET online = 0 WHERE correo = ?";
  db.query(sql, [correo], (err, result) => {
    if (err) {
      return res.status(500).json("Error al actualizar el estado online.");
    }

    if (result.affectedRows === 0) {
      return res.status(404).json("No se encontró el usuario.");
    }

    console.log(`✅ Usuario ${correo} ha cerrado sesión exitosamente.`);

    // Enviar respuesta indicando que debe eliminar el token
    res
      .status(200)
      .json({ message: "Sesión cerrada exitosamente.", logout: true });
  });
});

// ✅ Middleware para verificar si el usuario está online antes de acceder al Dashboard
const verificarSesion = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Obtener el token desde el header

  if (!token) {
    return res.status(403).json("No se ha proporcionado un token");
  }

  jwt.verify(token, "tu_secreto", (err, decoded) => {
    if (err) {
      return res.status(401).json("Token inválido");
    }

    // Verificar que el usuario esté online en la base de datos
    db.query(
      "SELECT online FROM usuarios WHERE correo = ?",
      [decoded.correo],
      (err, result) => {
        if (err) {
          return res.status(500).json("Error al verificar estado online.");
        }

        if (result.length === 0 || result[0].online === 0) {
          return res.status(403).json("No se puede acceder a la sesión");
        }

        req.user = decoded; // Poner el usuario en la solicitud
        next();
      }
    );
  });
};

// ✅ Ruta protegida del Dashboard
app.get("/dashboard", verificarSesion, (req, res) => {
  res.status(200).send("Bienvenido al Dashboard");
});

// Ruta para obtener productos
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener productos.");
    }
    res.status(200).json(results); // Enviamos los productos como respuesta en formato JSON
  });
});

// Ruta para agregar un nuevo producto
app.post("/productos", (req, res) => {
  const { producto, proveedor, cantidad, medida, precio, porcentaje } =
    req.body;

  // Validar los datos
  if (
    !producto ||
    !proveedor ||
    !cantidad ||
    !medida ||
    !precio ||
    porcentaje === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son obligatorios" });
  }

  // Consulta SQL para insertar el producto
  const query =
    "INSERT INTO productos (producto, proveedor, cantidad, medida, precio, porcentaje) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [producto, proveedor, cantidad, medida, precio, porcentaje],
    (err, result) => {
      if (err) {
        console.error("Error al agregar el producto:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error al agregar el producto" });
      }
      res
        .status(200)
        .json({ success: true, message: "Producto agregado correctamente" });
    }
  );
});

// Ruta para eliminar un producto
app.delete("/productos/:id", (req, res) => {
  const { id } = req.params;

  // Consulta SQL para eliminar el producto
  const query = "DELETE FROM productos WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar el producto:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error al eliminar el producto" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    res
      .status(200)
      .json({ success: true, message: "Producto eliminado correctamente" });
  });
});

// Ruta para actualizar un producto
app.put("/productos/:id", (req, res) => {
  const { id } = req.params; // Obtenemos el id del producto desde la URL
  const { producto, proveedor, cantidad, medida, precio, porcentaje } =
    req.body; // Obtenemos los datos actualizados del cuerpo de la solicitud

  // Validar que todos los campos sean proporcionados
  if (
    !producto ||
    !proveedor ||
    !cantidad ||
    !medida ||
    !precio === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son obligatorios" });
  }

  // Consulta SQL para actualizar el producto
  const query =
    "UPDATE productos SET producto = ?, proveedor = ?, cantidad = ?, medida = ?, precio = ?, porcentaje = ? WHERE id = ?";
  db.query(
    query,
    [producto, proveedor, cantidad, medida, precio, porcentaje, id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar el producto:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error al actualizar el producto" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Producto no encontrado" });
      }

      res
        .status(200)
        .json({ success: true, message: "Producto actualizado correctamente" });
    }
  );
});

// Ruta para obtener productos
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener productos.");
    }
    res.status(200).json(results); // Enviamos los productos como respuesta en formato JSON
  });
});

// Ruta para obtener los lotes
app.get("/api/lotes_cueros", (req, res) => {
  db.query("SELECT * FROM lotes_cueros", (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener los lotes.");
    }
    res.status(200).json(results); // Enviar los lotes como respuesta en formato JSON
  });
});

// Ruta para obtener los procesos
app.get("/api/procesos", (req, res) => {
  db.query("SELECT nombre_proceso FROM procesos", (err, results) => {
    if (err) {
      return res.status(500).send("Error al obtener los procesos.");
    }
    res.status(200).json(results); // Enviar los lotes como respuesta en formato JSON
  });
});

// Ruta para agregar un nuevo lote
app.post("/api/lotes_cueros", (req, res) => {
  const { tipo_cuero, cantidad, peso } = req.body;

  if (!tipo_cuero || !cantidad || !peso) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son obligatorios" });
  }

  // Obtener el primer proceso disponible con el nombre
  db.query(
    "SELECT nombre_proceso FROM procesos ORDER BY orden ASC LIMIT 1",
    (err, results) => {
      if (err) {
        console.error("Error al obtener el primer proceso:", err);
        return res.status(500).json({
          success: false,
          message: "Error al obtener el proceso inicial.",
        });
      }

      if (results.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No hay procesos definidos." });
      }

      const procesoInicial = results[0].nombre_proceso; // Usar el nombre del proceso
      console.log("Proceso inicial seleccionado:", procesoInicial); // Verificar que sea el nombre del proceso

      // Insertar el lote con datos predeterminados
      const query = `
        INSERT INTO lotes_cueros (tipo_cuero, cantidad, fecha_creacion, peso, proceso_actual)
        VALUES (?, ?, NOW(), ?, ?)
    `;
      console.log("Consulta SQL:", query, [
        tipo_cuero,
        cantidad,
        peso,
        procesoInicial,
      ]); // Verificar la consulta

      db.query(
        query,
        [tipo_cuero, cantidad, peso, procesoInicial],
        (err, result) => {
          if (err) {
            console.error("Error al agregar el lote:", err);
            return res
              .status(500)
              .json({ success: false, message: "Error al agregar el lote." });
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
            message: "Lote agregado correctamente",
            lote: responseData,
          });
        }
      );
    }
  );
});

app.get("/api/lotes_cueros/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM lotes_cueros WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).send("Error al obtener el lote.");
    }
    if (result.length === 0) {
      return res.status(404).send("Lote no encontrado.");
    }
    res.status(200).json(result[0]);
  });
});

// Ruta para obtener el inventario
app.get("/inventario", async (req, res) => {
  try {
    const [inventario] = await db.query("SELECT * FROM inventario");
    res.status(200).json(inventario); // Asegúrate de que esto sea un array
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    res.status(500).json({ success: false, message: "Error al obtener el inventario." });
  }
});

app.post("/inventario", async (req, res) => {
  const { cueroTipo, cantidad, estado } = req.body;

  const [registro] = await db.query(
    "SELECT cantidad FROM inventario WHERE tipo = ? AND estado = ?",
    [cueroTipo, estado]
  );

  let nuevaCantidad = cantidad;
  if (registro.length > 0) {
    nuevaCantidad += registro[0].cantidad;
    await db.query(
      "UPDATE inventario SET cantidad = ? WHERE tipo = ? AND estado = ?",
      [nuevaCantidad, cueroTipo, estado]
    );
  } else {
    await db.query(
      "INSERT INTO inventario (tipo, cantidad, estado) VALUES (?, ?, ?)",
      [cueroTipo, nuevaCantidad, estado]
    );
  }

  const [inventarioActualizado] = await db.query("SELECT * FROM inventario");
  res.json(inventarioActualizado);
});


