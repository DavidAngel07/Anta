const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
app.use(express.json());

const corsOptions = {
  origin: ["https://anta-system.up.railway.app", "http://localhost:3000"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

// 🔗 Configuración del pool de conexiones

const db = mysql.createPool({
  host: process.env.MYSQLHOST || "mysql.railway.internal",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "railway",
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

// Rutas
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente 🚀");
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001; // Usar el puerto de la variable de entorno

app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente 🚀`);
});

// ✅ Ruta para registrarse
app.post("/register", async (req, res) => {
  const { nombre, correo, contraseña } = req.body;
  console.log("📩 Recibiendo solicitud de registro:", req.body);

  try {
    const [results] = await dbPromise.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [correo]
    );

    if (results.length > 0) {
      return res.status(400).json("El correo ya está registrado.");
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(contraseña, saltRounds);

    await dbPromise.query(
      "INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)",
      [nombre, correo, hash]
    );

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

// Ruta para guardar simulación en las tablas lotes, detalle_lote_productos y total_proceso
app.post("/guardar-simulacion", async (req, res) => {
  const { nombreProceso, numeroLote, simulacionData, fecha } = req.body;
  console.log("Cuerpo de la petición:", req.body); 

  let fechaMysql;
  if (fecha.includes("T")) {
    fechaMysql = new Date(fecha).toISOString().slice(0, 10);
  } else {
    fechaMysql = fecha;
  }
  // Validar datos recibidos
  if (
    !numeroLote ||
    !nombreProceso ||
    !simulacionData ||
    !fecha ||
    simulacionData.length === 0
  ) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  try {
    // Obtener una conexión del pool
    const connection = await dbPromise.getConnection();

    try {
      // Obtener productos para referencias
      const [productos] = await connection.query("SELECT * FROM productos");

      // Iniciar transacción
      await connection.beginTransaction();

      // Calcular el peso y número de cueros totales del lote (se mantienen igual)
      const pesoTotal = simulacionData.reduce(
        (sum, s) => sum + parseFloat(s.peso || 0),
        0
      );
      const cuerosTotal = simulacionData.reduce(
        (sum, s) => sum + parseInt(s.cueros || 0),
        0
      );

      // Insertar el lote principal
      const [resultLote] = await connection.query(
        "INSERT INTO lotes (numero_lote, proceso, peso, numero_de_cueros, fecha) VALUES (?, ?, ?, ?, ?)",
        [numeroLote, nombreProceso, pesoTotal, cuerosTotal, fechaMysql]
      );

      const loteId = resultLote.insertId;

      // Preparar los detalles de productos para inserción masiva
      const detallesValues = [];

      // Preparar los totales por sulfurada para inserción masiva en total_proceso
      const totalesProcesoValues = [];

      // Procesar cada sulfurada
      for (const sulfurada of simulacionData) {
        console.log("Datos de sulfurada:", sulfurada);
        totalesProcesoValues.push([
          loteId,
          sulfurada.total,
          sulfurada.totalPorCuero,
        ]);

        // Procesar cada fila de cada sulfurada para detalle_lote_productos
        for (const fila of sulfurada.filas || []) {
          // Solo procesar filas con producto y cantidad válidos
          if (fila.producto && fila.cantidad) {
            const productoId = parseInt(fila.producto);
            const productoInfo = productos.find((p) => p.id === productoId);

            if (productoInfo) {
              detallesValues.push([
                loteId,
                productoInfo.producto,
                parseFloat(fila.cantidad) || 0,
                parseFloat(productoInfo.precio) || 0,
                parseFloat(fila.total) ||
                  parseFloat(fila.cantidad) * parseFloat(productoInfo.precio) ||
                  0,
              ]);
            }
          }
        }
      }

      // Insertar los detalles de productos si hay alguno
      if (detallesValues.length > 0) {
        await connection.query(
          "INSERT INTO detalle_lote_productos (lote_id, producto_nombre, cantidad, precio_unitario, total) VALUES ?",
          [detallesValues]
        );
      }

      // Insertar los totales en la tabla total_proceso si hay datos
      if (totalesProcesoValues.length > 0) {
        console.log("Valores a insertar en total_proceso:", totalesProcesoValues);
        await connection.query(
          "INSERT INTO total_proceso (lote_id, total, total_cuero) VALUES ?",
          [totalesProcesoValues]
        );
      } else {
        console.log("No hay totales para insertar en total_proceso.");
      }

      // Confirmar transacción
      await connection.commit();

      // Liberar la conexión
      connection.release();

      res.status(200).json({
        success: true,
        message: "Simulación guardada exitosamente.",
        loteId: loteId,
      });
    } catch (error) {
      // Revertir transacción si hay algún error
      await connection.rollback();
      // Liberar la conexión
      connection.release();

      console.error("Error en la transacción:", error);
      res.status(500).json({
        success: false,
        error: "Error al guardar la simulación.",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener la lista de productos.",
      details: error.message,
    });
  }
});

// Ruta para obtener todos los lotes
app.get("/lotes", async (req, res) => {
  try {
    // Consulta principal para obtener los lotes
    const [lotes] = await dbPromise.query(`
      SELECT l.*, 
             COUNT(d.id) as cantidad_productos,
             SUM(d.total) as costo_total
      FROM lotes l
      LEFT JOIN detalle_lote_productos d ON l.id = d.lote_id
      GROUP BY l.id
      ORDER BY l.fecha DESC
    `);

    res.status(200).json({
      success: true,
      data: lotes,
    });
  } catch (error) {
    console.error("Error al obtener lotes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los lotes.",
      details: error.message,
    });
  }
});

// Ruta para obtener detalles de un lote específico
app.get("/lotes/:id", async (req, res) => {
  const loteId = req.params.id;

  try {
    // Obtener información del lote
    const [lote] = await dbPromise.query("SELECT * FROM lotes WHERE id = ?", [
      loteId,
    ]);

    if (lote.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lote no encontrado",
      });
    }

    // Obtener detalles de productos del lote
    const [detalles] = await dbPromise.query(
      "SELECT * FROM detalle_lote_productos WHERE lote_id = ?",
      [loteId]
    );

    res.status(200).json({
      success: true,
      lote: lote[0],
      detalles: detalles,
    });
  } catch (error) {
    console.error("Error al obtener detalles del lote:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los detalles del lote.",
      details: error.message,
    });
  }
});

// Ruta para eliminar un lote y sus detalles asociados
app.delete('/eliminar-lote/:loteId', async (req, res) => {
  const loteId = req.params.loteId;
  
  // Validar que se recibió un ID válido
  if (!loteId || isNaN(loteId)) {
    return res.status(400).json({ error: 'ID de lote inválido.' });
  }
  
  try {
    // Obtener una conexión del pool
    const connection = await dbPromise.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Primero eliminar los detalles del lote (tabla detalle_lote_productos)
      await connection.query(
        'DELETE FROM detalle_lote_productos WHERE lote_id = ?',
        [loteId]
      );
      
      // Luego eliminar el lote
      const [result] = await connection.query(
        'DELETE FROM lotes WHERE id = ?',
        [loteId]
      );
      
      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Lote no encontrado.' });
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Liberar la conexión
      connection.release();
      
      res.status(200).json({ 
        success: true,
        message: 'Lote eliminado exitosamente.'
      });
      
    } catch (error) {
      // Revertir transacción si hay algún error
      await connection.rollback();
      // Liberar la conexión
      connection.release();
      
      console.error('Error en la transacción:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al eliminar el lote.', 
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al conectar con la base de datos.', 
      details: error.message 
    });
  }
});

app.get("/procesos-por-lote/:numeroLote", async (req, res) => {
  const numeroLote = req.params.numeroLote;

  if (!numeroLote) {
    return res.status(400).json({
      success: false,
      error: "Número de lote inválido.",
    });
  }

  try {
    // Primero obtenemos el ID del lote
    const [loteResult] = await dbPromise.query(
      "SELECT id FROM lotes WHERE numero_lote = ?",
      [numeroLote]
    );

    if (loteResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lote no encontrado.",
      });
    }

    const loteId = loteResult[0].id;

    // Modificamos esta consulta para incluir el id como id_lote
    const [procesos] = await dbPromise.query(
      `SELECT l.proceso, l.id as id_lote
       FROM lotes l
       WHERE l.numero_lote = ?`,
      [numeroLote]
    );

    if (procesos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron procesos para este lote.",
      });
    }

    res.status(200).json(procesos);
  } catch (error) {
    console.error("Error al obtener procesos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener procesos para el lote.",
      details: error.message,
    });
  }
});

app.get('/total-cuero/:id_lote', async (req, res) => {
  const { id_lote } = req.params;
  console.log(`Buscando total_cuero para id_lote: ${id_lote}`);
  
  try {
    const [rows] = await dbPromise.query(
      'SELECT total_cuero FROM total_proceso WHERE lote_id = ?',
      [id_lote]
    );

    console.log('Resultado de la consulta:', rows);

    if (rows.length === 0) {
      console.log(`No se encontró ningún registro para id_lote: ${id_lote}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Lote no encontrado',
        id_lote_buscado: id_lote 
      });
    }

    return res.json({ 
      success: true, 
      total_cuero: rows[0].total_cuero,
      id_lote_encontrado: id_lote
    });
  } catch (error) {
    console.error('Error al obtener total_cuero:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

app.post("/guardar-costos", async (req, res) => {
  const connection = await dbPromise.getConnection();  
  try {
    // Comenzamos una transacción para asegurar integridad de datos
    await connection.beginTransaction();
    
    const {
      numeroLote,
      fecha,
      peso,
      cueros,
      color,
      servicios,
      promedioDcm
    } = req.body;
    
    // Validación básica
    if (!numeroLote || !fecha || !peso || !cueros) {
      return res.status(400).json({ 
        success: false, 
        error: "Datos incompletos. Por favor complete todos los campos requeridos." 
      });
    }

    // 1. Insertar en la tabla costos
    const [costoResult] = await connection.execute(
      "INSERT INTO costos (numero_lote, peso, numero_cueros, fecha, color, prom_dcm) VALUES (?, ?, ?, ?, ?, ?)",
      [numeroLote, peso, cueros, fecha, color, promedioDcm]
    );
    
    const costoId = costoResult.insertId;
    
    // 2. Insertar los detalles de cada servicio
    if (Array.isArray(servicios) && servicios.length > 0) {
      for (const servicio of servicios) {
        // Solo guardar servicios que tienen datos
        if (servicio.servicioId && servicio.cantidad && servicio.precio) {
          await connection.execute(
            "INSERT INTO detalle_costos (costo_id, servicio, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)",
            [
              costoId,
              servicio.servicioId, // Puede ser un ID o nombre dependiendo del tipo de servicio
              servicio.cantidad,
              servicio.precio,
              servicio.total
            ]
          );
        }
      }
    }
    
    // 3. Calcular y guardar los totales
    const totalGeneral = servicios.reduce((sum, servicio) => sum + (servicio.total || 0), 0);
    const totalPorCuero = cueros > 0 ? totalGeneral / cueros : 0;
    const totalPorDcm = promedioDcm && cueros > 0 ? totalPorCuero / parseFloat(promedioDcm) : 0;
    
    await connection.execute(
      "INSERT INTO total_costo (costo_id, total, total_cuero, total_dcm) VALUES (?, ?, ?, ?)",
      [costoId, totalGeneral, totalPorCuero, totalPorDcm]
    );
    
    // Confirmar la transacción
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: "Costos guardados exitosamente",
      loteId: costoId
    });
    
  } catch (error) {
    // Si hay un error, revertir la transacción
    await connection.rollback();
    
    console.error("Error al guardar los costos:", error);
    res.status(500).json({
      success: false,
      error: "Error al guardar los costos: " + error.message
    });
  } finally {
    // Siempre liberar la conexión
    connection.release();
  }
});

// Ruta para obtener todos los costos
app.get("/costos", async (req, res) => {
  try {
    // Consulta principal para obtener los costos
    const [costos] = await dbPromise.query(`
      SELECT c.*, 
             COUNT(dc.id) as cantidad_servicios,
             tc.total as costo_total
      FROM costos c
      LEFT JOIN detalle_costos dc ON c.id = dc.costo_id
      LEFT JOIN total_costo tc ON c.id = tc.costo_id
      GROUP BY c.id
      ORDER BY c.fecha DESC
    `);

    res.status(200).json({
      success: true,
      data: costos,
    });
  } catch (error) {
    console.error("Error al obtener costos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los costos.",
      details: error.message,
    });
  }
});

// Ruta para obtener detalles de un costo específico
app.get("/costos/:id", async (req, res) => {
  const costoId = req.params.id;

  try {
    // Obtener información del costo
    const [costo] = await dbPromise.query("SELECT * FROM costos WHERE id = ?", [
      costoId,
    ]);

    if (costo.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Costo no encontrado",
      });
    }

    // Obtener detalles de servicios del costo
    const [detalles] = await dbPromise.query(
      "SELECT * FROM detalle_costos WHERE costo_id = ?",
      [costoId]
    );

    // Obtener el total del costo
    const [totalCosto] = await dbPromise.query(
      "SELECT * FROM total_costo WHERE costo_id = ?",
      [costoId]
    );

    res.status(200).json({
      success: true,
      costo: costo[0],
      detalles: detalles,
      total: totalCosto.length > 0 ? totalCosto[0] : null,
    });
  } catch (error) {
    console.error("Error al obtener detalles del costo:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los detalles del costo.",
      details: error.message,
    });
  }
});

// Ruta para eliminar un costo y sus detalles asociados
app.delete('/eliminar-costo/:costoId', async (req, res) => {
  const costoId = req.params.costoId;
  
  // Validar que se recibió un ID válido
  if (!costoId || isNaN(costoId)) {
    return res.status(400).json({ error: 'ID de costo inválido.' });
  }
  
  try {
    // Obtener una conexión del pool
    const connection = await dbPromise.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Primero eliminar el total del costo (tabla total_costo)
      await connection.query(
        'DELETE FROM total_costo WHERE costo_id = ?',
        [costoId]
      );
      
      // Luego eliminar los detalles del costo (tabla detalle_costos)
      await connection.query(
        'DELETE FROM detalle_costos WHERE costo_id = ?',
        [costoId]
      );
      
      // Finalmente eliminar el costo
      const [result] = await connection.query(
        'DELETE FROM costos WHERE id = ?',
        [costoId]
      );
      
      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Costo no encontrado.' });
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Liberar la conexión
      connection.release();
      
      res.status(200).json({ 
        success: true,
        message: 'Costo eliminado exitosamente.'
      });
      
    } catch (error) {
      // Revertir transacción si hay algún error
      await connection.rollback();
      // Liberar la conexión
      connection.release();
      
      console.error('Error en la transacción:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al eliminar el costo.', 
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al conectar con la base de datos.', 
      details: error.message 
    });
  }
});