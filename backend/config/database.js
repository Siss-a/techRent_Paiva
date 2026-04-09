// =============================================
// CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS
// =============================================
// O mysql2 é usado por ter suporte a Promises (async/await),
// o que facilita muito o código assíncrono no Node.js.

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Cria um "pool" de conexões.
// Um pool reutiliza conexões abertas ao invés de abrir uma nova a cada query,
// o que é mais eficiente e evita sobrecarregar o banco.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Número máximo de conexões simultâneas no pool
  connectionLimit: 10,

  // Retorna valores numéricos como números JS (não como strings)
  typeCast: true,
});

// Função para obter uma conexão do pool
async function getConnection() {
    return pool.getConnection();
}

// Função para ler registros (um ou múltiplos)
async function read(table, where = null) {
    const connection = await getConnection();
    try {
        let sql = `SELECT * FROM ${table}`;
        if (where) {
            sql += ` WHERE ${where}`;
        }

        const [rows] = await connection.execute(sql);
        return rows;
    } finally {
        connection.release();
    }
}

// Função para inserir um novo registro
async function create(table, data) {
    const connection = await getConnection();
    try {
        const columns = Object.keys(data).join(', ');
        const placeholders = Array(Object.keys(data).length).fill('?').join(', ');
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const values = Object.values(data);

        const [result] = await connection.execute(sql, values);
        return result.insertId;
    } finally {
        connection.release();
    }
}

// Função para atualizar um registro
async function update(table, data, where) {
    const connection = await getConnection();
    try {
        const set = Object.keys(data)
            .map(column => `${column} = ?`)
            .join(', ');

        const sql = `UPDATE ${table} SET ${set} WHERE ${where}`;
        const values = Object.values(data);

        const [result] = await connection.execute(sql, [...values]);
        return result.affectedRows;
    } finally {
        connection.release();
    }
}

// Função para excluir um registro
async function deleteRecord(table, where) {
    const connection = await getConnection();
    try {
        const sql = `DELETE FROM ${table} WHERE ${where}`;
        const [result] = await connection.execute(sql);
        return result.affectedRows;
    } finally {
        connection.release();
    }
}

// Função para comparar senha com hash
async function comparePassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('Erro ao comparar senha:', error);
        return false;
    }
}

// Função para gerar hash da senha
async function hashPassword(password) {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error('Erro ao gerar hash da senha:', error);
        throw error;
    }
}

export { 
    create, 
    read, 
    update, 
    deleteRecord, 
    comparePassword, 
    hashPassword,
    getConnection
};
