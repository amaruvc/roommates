const express = require("express");
const fs = require("fs").promises;
const uuid = require("uuid");
const nuevoRoommate = require("./roommate");

const app = express();

app.use(express.static("static"));

app.post("/roommates", async (req, res) => {
  try {
    const { id, nombre } = await nuevoRoommate();
    const contenido = await fs.readFile("roommates.json", {
      encoding: "utf-8",
    });

    const datos = JSON.parse(contenido);

    datos.roommates.push({ id, nombre, debe: 0, recibe: 0 });

    await fs.writeFile("roommates.json", JSON.stringify(datos), "utf-8");
    res.status(201).json({ mensaje: "Rommie agregado" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/roommates", async (req, res) => {
  try {
    const contenido = await fs.readFile("roommates.json", {
      encoding: "utf-8",
    });

    const datos = JSON.parse(contenido);

    res.status(200).send(datos);
  } catch (error) {
    res.status(500).send(err.message);
  }
});

app.get("/gastos", async (req, res) => {
  try {
    const contenido = await fs.readFile("gastos.json", {
      encoding: "utf-8",
    });

    const datos = JSON.parse(contenido);

    res.status(500).send(datos);
  } catch (error) {
    res.status(500).send(err.message);
  }
});

app.post("/gastos", async (req, res) => {
  try {
    let body;
    req.on("data", (payload) => {
      body = JSON.parse(payload);
    });
    req.on("end", async () => {
      const contenidoGastos = await fs.readFile("gastos.json", {
        encoding: "utf-8",
      });
      const historicoGastos = JSON.parse(contenidoGastos);

      const contenidoRoommates = await fs.readFile("roommates.json", {
        encoding: "utf-8",
      });
      let dataRoommates = JSON.parse(contenidoRoommates);

      const id = uuid.v4();
      const roommate = body.roommate;
      const descripcion = body.descripcion;
      const monto = body.monto;
      historicoGastos.gastos.push({ id, roommate, descripcion, monto });

      const encontrado = dataRoommates.roommates.findIndex(
        (r) => r.nombre == roommate
      );

      if (encontrado == -1) {
        await fs.writeFile(
          "gastos.json",
          JSON.stringify(historicoGastos),
          "utf-8"
        );
        res.status(404).send("Roommate no encontrado");
      } else {
        dataRoommates.roommates[encontrado].debe =
          dataRoommates.roommates[encontrado].debe + monto;

        await fs.writeFile(
          "roommates.json",
          JSON.stringify(dataRoommates),
          "utf-8"
        );
        res.status(201).json({ mensaje: "Gasto agregado" });
        await fs.writeFile(
          "gastos.json",
          JSON.stringify(historicoGastos),
          "utf-8"
        );
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/gastos", async (req, res) => {
  try {
    const contenidoGastos = await fs.readFile("gastos.json", {
      encoding: "utf-8",
    });
    const historicoGastos = JSON.parse(contenidoGastos);

    const contenidoRoommates = await fs.readFile("roommates.json", {
      encoding: "utf-8",
    });
    let dataRoommates = JSON.parse(contenidoRoommates);

    const idGasto = req.query.id;

    const encontrado = historicoGastos.gastos.findIndex((g) => g.id == idGasto);
    const encontradoRoommie = dataRoommates.roommates.findIndex(
      (r) => r.nombre == historicoGastos.gastos[encontrado].roommate
    );

    if (encontrado == -1) {
      res.status(404).send("Gasto no encontrado");
    } else {
      dataRoommates.roommates[encontradoRoommie].debe =
        dataRoommates.roommates[encontradoRoommie].debe -
        historicoGastos.gastos[encontrado].monto;

      historicoGastos.gastos.splice(encontrado, 1);

      await fs.writeFile(
        "roommates.json",
        JSON.stringify(dataRoommates),
        "utf-8"
      );
      res.status(204).json({ mensaje: "Gasto eliminado" });
      await fs.writeFile(
        "gastos.json",
        JSON.stringify(historicoGastos),
        "utf-8"
      );
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/gastos", async (req, res) => {
  try {
    let body;
    req.on("data", (payload) => {
      body = JSON.parse(payload);
    });
    req.on("end", async () => {
      const contenidoGastos = await fs.readFile("gastos.json", {
        encoding: "utf-8",
      });
      const historicoGastos = JSON.parse(contenidoGastos);

      const contenidoRoommates = await fs.readFile("roommates.json", {
        encoding: "utf-8",
      });
      let dataRoommates = JSON.parse(contenidoRoommates);

      const roommate = body.roommate;
      const descripcion = body.descripcion;
      const monto = body.monto;
      const id = req.query.id;

      const encontrado = historicoGastos.gastos.findIndex((g) => g.id == id);

      //   const idGasto = historicoGastos.gastos[encontrado].id;

      let encontradoRoommie = dataRoommates.roommates.findIndex(
        (r) => r.nombre == historicoGastos.gastos[encontrado].roommate
      );

      dataRoommates.roommates[encontradoRoommie].debe =
        dataRoommates.roommates[encontradoRoommie].debe -
        historicoGastos.gastos[encontrado].monto;

      if (encontrado == -1) {
        res.status(404).send("Gasto no encontrado");
      }

      historicoGastos.gastos[encontrado].descripcion = descripcion;
      historicoGastos.gastos[encontrado].monto = monto;
      historicoGastos.gastos[encontrado].roommate = roommate;

      encontradoRoommie = dataRoommates.roommates.findIndex(
        (r) => r.nombre == roommate
      );

      dataRoommates.roommates[encontradoRoommie].debe =
        dataRoommates.roommates[encontradoRoommie].debe +
        historicoGastos.gastos[encontrado].monto;

      await fs.writeFile(
        "roommates.json",
        JSON.stringify(dataRoommates),
        "utf-8"
      );
      res.status(200).json({ mensaje: "Gasto editado" });
      await fs.writeFile(
        "gastos.json",
        JSON.stringify(historicoGastos),
        "utf-8"
      );
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log("servidor ejecutando");
});
