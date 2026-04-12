module.exports = new Proxy(
  {},
  {
    get: (_, property) => (typeof property === "string" ? property : ""),
  }
);
