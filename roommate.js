const uuid = require("uuid");
const axios = require("axios");

module.exports = async () => {
  let data = await axios.get("https://randomuser.me/api");
  data = data.data.results;

  const nombre = `${data[0].name.first} ${data[0].name.last}`;
  const id = uuid.v4();

  return { id, nombre };
};
