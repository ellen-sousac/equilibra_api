const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      usuarioId,
      texto,
      dataHora,
      dataCriacao,
    } = req.body;

    if (!usuarioId || !texto || !dataHora) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO anotacoes
      (usuario_id, texto, data_hora, data_criacao)
      VALUES (?, ?, ?, ?)`,
      [
        usuarioId,
        texto,
        dataHora,
        dataCriacao || new Date(),
      ]
    );

    return res.status(201).json({
      ok: true,
      mensagem: 'Anotação salva com sucesso.',
      id: resultado.insertId,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao salvar anotação.',
      erro: erro.message,
    });
  }
});

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [anotacoes] = await pool.query(
      `SELECT
        id,
        texto,
        data_hora AS dataHora,
        data_criacao AS dataCriacao
      FROM anotacoes
      WHERE usuario_id = ?
      ORDER BY data_hora DESC`,
      [usuarioId]
    );

    return res.json({
      ok: true,
      anotacoes,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar anotações.',
      erro: erro.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      texto,
      dataHora,
    } = req.body;

    await pool.query(
      `UPDATE anotacoes
       SET texto = ?, data_hora = ?
       WHERE id = ?`,
      [
        texto,
        dataHora,
        id,
      ]
    );

    return res.json({
      ok: true,
      mensagem: 'Anotação atualizada com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao atualizar anotação.',
      erro: erro.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM anotacoes WHERE id = ?',
      [id]
    );

    return res.json({
      ok: true,
      mensagem: 'Anotação excluída com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao excluir anotação.',
      erro: erro.message,
    });
  }
});

module.exports = router;