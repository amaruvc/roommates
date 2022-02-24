const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const uuid = require("uuid");

const app = express();

app.use(express.static("static"));

app.post("/roommates", async (req, res) => {
  try {
    let data = await axios.get("https://randomuser.me/api");
    data = data.data.results;

    const nombre = `${data[0].name.first} ${data[0].name.last}`;
    const id = uuid.v4();

    const contenido = await fs.readFile("roommates.json", {
      encoding: "utf-8",
    });

    const datos = JSON.parse(contenido);

    datos.roommates.push({ id, nombre, debe: 0, recibe: 0 });

    await fs.writeFile("roommates.json", JSON.stringify(datos), "utf-8");
    res.json({ mensaje: "Rommie agregado" });
  } catch (err) {
    throw err;
  }
});

app.get("/roommates", async (req, res) => {
  const contenido = await fs.readFile("roommates.json", {
    encoding: "utf-8",
  });

  const datos = JSON.parse(contenido);

  res.send(datos);
});

app.get("/gastos", async (req, res) => {
  const contenido = await fs.readFile("gastos.json", {
    encoding: "utf-8",
  });

  const datos = JSON.parse(contenido);

  res.send(datos);
});

app.post("/gastos", async (req, res) => {
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
      res.send({ todo: "OK" });
    } else {
      dataRoommates.roommates[encontrado].debe =
        dataRoommates.roommates[encontrado].debe + monto;

      await fs.writeFile(
        "roommates.json",
        JSON.stringify(dataRoommates),
        "utf-8"
      );
      res.json({ mensaje: "Gasto agregado" });
      await fs.writeFile(
        "gastos.json",
        JSON.stringify(historicoGastos),
        "utf-8"
      );
    }
  });
});

app.delete("/gastos", async (req, res) => {
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
    res.send("Gasto no encontrado");
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
    res.json({ mensaje: "Gasto eliminado" });
    await fs.writeFile("gastos.json", JSON.stringify(historicoGastos), "utf-8");
  }
});

app.put("/gastos", async (req, res) => {
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

    const encontrado = historicoGastos.gastos.findIndex(
      (g) => g.roommate == roommate
    );

    //   const idGasto = historicoGastos.gastos[encontrado].id;

    const encontradoRoommie = dataRoommates.roommates.findIndex(
      (r) => r.nombre == historicoGastos.gastos[encontrado].roommate
    );

    dataRoommates.roommates[encontradoRoommie].debe =
      dataRoommates.roommates[encontradoRoommie].debe -
      historicoGastos.gastos[encontrado].monto;

    if (encontrado == -1) {
      res.send("Gasto no encontrado");
    }

    if (
      historicoGastos.gastos[encontrado].descripcion != descripcion ||
      historicoGastos.gastos[encontrado].roommate != roommate ||
      historicoGastos.gastos[encontrado].monto != monto
    ) {
      historicoGastos.gastos[encontrado].descripcion = descripcion;
      historicoGastos.gastos[encontrado].monto = monto;
      historicoGastos.gastos[encontrado].roommate = roommate;

      dataRoommates.roommates[encontradoRoommie].debe =
        dataRoommates.roommates[encontradoRoommie].debe +
        historicoGastos.gastos[encontrado].monto;

      await fs.writeFile(
        "roommates.json",
        JSON.stringify(dataRoommates),
        "utf-8"
      );
      res.json({ mensaje: "Gasto editado" });
      await fs.writeFile(
        "gastos.json",
        JSON.stringify(historicoGastos),
        "utf-8"
      );
    }
  });
});

app.listen(3000, () => {
  console.log("servidor ejecutando");
});
