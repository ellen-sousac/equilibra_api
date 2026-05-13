const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      usuarioId,
      glicemia,
      observacao,
      dataHora,
      dataCriacao,
    } = req.body;

    if (!usuarioId || !glicemia || !dataHora) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO glicemias
      (usuario_id, glicemia, observacao, data_hora, data_criacao)
      VALUES (?, ?, ?, ?, ?)`,
      [
        usuarioId,
        glicemia,
        observacao || '',
        dataHora,
        dataCriacao || new Date(),
      ]
    );

    return res.status(201).json({
      ok: true,
      mensagem: 'Registro glicêmico salvo com sucesso.',
      id: resultado.insertId,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao salvar glicemia.',
      erro: erro.message,
    });
  }
});

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [registros] = await pool.query(
      `SELECT
        id,
        glicemia,
        observacao,
        data_hora AS dataHora,
        data_criacao AS dataCriacao
      FROM glicemias
      WHERE usuario_id = ?
      ORDER BY data_hora DESC`,
      [usuarioId]
    );

    return res.json({
      ok: true,
      registros,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar glicemias.',
      erro: erro.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM glicemias WHERE id = ?',
      [id]
    );

    return res.json({
      ok: true,
      mensagem: 'Registro glicêmico excluído com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao excluir glicemia.',
      erro: erro.message,
    });
  }
});

module.exports = router;