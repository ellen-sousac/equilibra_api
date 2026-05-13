const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      usuarioId,
      nome,
      tipo,
      refeicao,
      momento,
      observacao,
      dataCriacao,
    } = req.body;

    if (!usuarioId || !nome || !tipo || !refeicao || !momento) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO medicamentos
      (usuario_id, nome, tipo, refeicao, momento, observacao, data_criacao)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        nome,
        tipo,
        refeicao,
        momento,
        observacao || '',
        dataCriacao || new Date(),
      ]
    );

    return res.status(201).json({
      ok: true,
      mensagem: 'Medicamento salvo com sucesso.',
      id: resultado.insertId,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao salvar medicamento.',
      erro: erro.message,
    });
  }
});

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [medicamentos] = await pool.query(
      `SELECT
        id,
        nome,
        tipo,
        refeicao,
        momento,
        observacao,
        data_criacao AS dataCriacao
      FROM medicamentos
      WHERE usuario_id = ?
      ORDER BY data_criacao DESC`,
      [usuarioId]
    );

    return res.json({
      ok: true,
      medicamentos,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar medicamentos.',
      erro: erro.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nome,
      tipo,
      refeicao,
      momento,
      observacao,
    } = req.body;

    if (!nome || !tipo || !refeicao || !momento) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    await pool.query(
      `UPDATE medicamentos
       SET nome = ?, tipo = ?, refeicao = ?, momento = ?, observacao = ?
       WHERE id = ?`,
      [
        nome,
        tipo,
        refeicao,
        momento,
        observacao || '',
        id,
      ]
    );

    return res.json({
      ok: true,
      mensagem: 'Medicamento atualizado com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao atualizar medicamento.',
      erro: erro.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM medicamentos WHERE id = ?',
      [id]
    );

    return res.json({
      ok: true,
      mensagem: 'Medicamento excluído com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao excluir medicamento.',
      erro: erro.message,
    });
  }
});

module.exports = router;