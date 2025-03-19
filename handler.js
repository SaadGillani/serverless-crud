"use strict";

const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.RDS_HOST || "localhost",
  user: process.env.RDS_USER || "postgres",
  password: process.env.RDS_PASSWORD || "postgres",
  database: process.env.RDS_DATABASE || "postgres",
  port: process.env.RDS_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const send = (statusCode, message) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
};

const isAdmin = async (client, headers) => {
  const userId = headers["user-id"];

  const sql = "SELECT role FROM users WHERE id = $1";
  const data = await client.query(sql, [userId]);

  return data?.rows[0]?.role === "admin";
};

module.exports.createProduct = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const client = await pool.connect();

    if (!(await isAdmin(client, event.headers))) {
      throw new Error("Unauthorised");
    }

    const data = JSON.parse(event.body);
    const sql = "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3)";
    const values = [data.name, data.price, data.stock];

    await client.query(sql, values);
    client.release();
    cb(null, send(200, data));
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

module.exports.updateProduct = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const id = event.pathParameters.id;
    const data = JSON.parse(event.body);
    const sql =
      "UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4";
    const values = [data.name, data.price, data.stock, id];
    const client = await pool.connect();
    const result = await client.query(sql, values);
    client.release();
    if (result.rowCount === 0) {
      cb(null, send(404, "Product not found"));
    } else {
      cb(null, send(200, data));
    }
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

module.exports.deleteProduct = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const id = event.pathParameters.id;
    const sql = "DELETE FROM products WHERE id = $1";
    const client = await pool.connect();
    const result = await client.query(sql, [id]);
    client.release();
    if (result.rowCount === 0) {
      cb(null, send(404, "Product not found"));
    } else {
      cb(null, send(200, "Product deleted"));
    }
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

module.exports.getAllProducts = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const sql = "SELECT * FROM products";
    const client = await pool.connect();
    const result = await client.query(sql);
    client.release();
    cb(null, send(200, result.rows));
  } catch (error) {
    cb(null, send(500, error.message));
  }
};
