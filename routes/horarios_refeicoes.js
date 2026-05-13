const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [horarios] = await pool.query(
      `SELECT cafe, almoco, jantar
       FROM horarios_refeicoes
       WHERE usuario_id = ?`,
      [usuarioId]
    );

    if (horarios.length === 0) {
      await pool.query(
        `INSERT INTO horarios_refeicoes
        (usuario_id, cafe, almoco, jantar)
        VALUES (?, '07:00', '12:00', '19:00')`,
        [usuarioId]
      );

      return res.json({
        ok: true,
        horarios: {
          cafe: '07:00',
          almoco: '12:00',
          jantar: '19:00',
        },
      });
    }

    return res.json({
      ok: true,
      horarios: horarios[0],
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao buscar horários das refeições.',
      erro: erro.message,
    });
  }
});

router.put('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { cafe, almoco, jantar } = req.body;

    if (!cafe || !almoco || !jantar) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Informe os horários de café, almoço e jantar.',
      });
    }

    await pool.query(
      `INSERT INTO horarios_refeicoes
      (usuario_id, cafe, almoco, jantar)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cafe = VALUES(cafe),
        almoco = VALUES(almoco),
        jantar = VALUES(jantar)`,
      [usuarioId, cafe, almoco, jantar]
    );

    return res.json({
      ok: true,
      mensagem: 'Horários atualizados com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao atualizar horários das refeições.',
      erro: erro.message,
    });
  }
});

module.exports = router;