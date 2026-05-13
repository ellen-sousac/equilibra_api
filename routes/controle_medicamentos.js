const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/marcar', async (req, res) => {
  try {
    const {
      usuarioId,
      medicamentoId,
      dataControle,
      tomado,
      dataConfirmacao,
    } = req.body;

    if (!usuarioId || !medicamentoId || !dataControle) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    await pool.query(
      `DELETE FROM controle_medicamentos
       WHERE usuario_id = ? AND medicamento_id = ? AND data_controle = ?`,
      [usuarioId, medicamentoId, dataControle]
    );

    if (tomado) {
      await pool.query(
        `INSERT INTO controle_medicamentos
        (usuario_id, medicamento_id, data_controle, tomado, data_confirmacao)
        VALUES (?, ?, ?, ?, ?)`,
        [
          usuarioId,
          medicamentoId,
          dataControle,
          1,
          dataConfirmacao || new Date(),
        ]
      );
    }

    return res.json({
      ok: true,
      mensagem: tomado
        ? 'Medicamento marcado como tomado.'
        : 'Medicamento desmarcado.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao atualizar controle do medicamento.',
      erro: erro.message,
    });
  }
});

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [controles] = await pool.query(
      `SELECT
        id,
        usuario_id AS usuarioId,
        medicamento_id AS medicamentoId,
        data_controle AS dataControle,
        tomado,
        data_confirmacao AS dataConfirmacao
      FROM controle_medicamentos
      WHERE usuario_id = ?
      ORDER BY data_controle DESC`,
      [usuarioId]
    );

    return res.json({
      ok: true,
      controles,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar controle dos medicamentos.',
      erro: erro.message,
    });
  }
});

router.get('/semana/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [controles] = await pool.query(
      `SELECT
        id,
        usuario_id AS usuarioId,
        medicamento_id AS medicamentoId,
        data_controle AS dataControle,
        tomado,
        data_confirmacao AS dataConfirmacao
      FROM controle_medicamentos
      WHERE usuario_id = ?
        AND data_controle >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      ORDER BY data_controle DESC`,
      [usuarioId]
    );

    return res.json({
      ok: true,
      controles,
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar histórico semanal.',
      erro: erro.message,
    });
  }
});

module.exports = router;