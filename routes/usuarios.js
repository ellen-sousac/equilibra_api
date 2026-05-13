const express = require('express');
const router = express.Router();
const pool = require('../db');

function limparCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

router.post('/cadastro', async (req, res) => {
  try {
    const {
      nome,
      cpf,
      emailRecuperacao,
      pin,
      dataNascimento,
      tipoDiabetes,
      usaInsulina,
    } = req.body;

    const cpfLimpo = limparCpf(cpf);

    if (!nome || cpfLimpo.length !== 11 || !emailRecuperacao || !pin) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    if (String(pin).length !== 6) {
      return res.status(400).json({
        ok: false,
        mensagem: 'O PIN deve conter 6 dígitos.',
      });
    }

    const [existente] = await pool.query(
      'SELECT id FROM usuarios WHERE cpf = ?',
      [cpfLimpo]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        ok: false,
        mensagem: 'CPF já cadastrado.',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO usuarios
      (nome, cpf, email_recuperacao, pin, data_nascimento, tipo_diabetes, usa_insulina)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        cpfLimpo,
        emailRecuperacao,
        pin,
        dataNascimento,
        tipoDiabetes || 'Não informado',
        usaInsulina ? 1 : 0,
      ]
    );

    await pool.query(
      `INSERT INTO horarios_refeicoes
      (usuario_id, cafe, almoco, jantar)
      VALUES (?, '07:00', '12:00', '19:00')`,
      [resultado.insertId]
    );

    return res.status(201).json({
      ok: true,
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: {
        id: resultado.insertId,
        nome,
        cpf: cpfLimpo,
        emailRecuperacao,
        dataNascimento,
        tipoDiabetes: tipoDiabetes || 'Não informado',
        usaInsulina: !!usaInsulina,
      },
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao cadastrar usuário.',
      erro: erro.message,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { cpf, pin } = req.body;
    const cpfLimpo = limparCpf(cpf);

    const [usuarios] = await pool.query(
      `SELECT id, nome, cpf, email_recuperacao, data_nascimento,
              tipo_diabetes, usa_insulina, data_criacao
       FROM usuarios
       WHERE cpf = ? AND pin = ?`,
      [cpfLimpo, pin]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        ok: false,
        mensagem: 'CPF ou PIN inválido.',
      });
    }

    const usuario = usuarios[0];

    return res.json({
      ok: true,
      mensagem: 'Login realizado com sucesso.',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        cpf: usuario.cpf,
        emailRecuperacao: usuario.email_recuperacao,
        dataNascimento: usuario.data_nascimento,
        tipoDiabetes: usuario.tipo_diabetes,
        usaInsulina: !!usuario.usa_insulina,
        dataCriacao: usuario.data_criacao,
      },
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao realizar login.',
      erro: erro.message,
    });
  }
});

router.post('/recuperar-pin', async (req, res) => {
  try {
    const { cpf, emailRecuperacao, novoPin } = req.body;
    const cpfLimpo = limparCpf(cpf);

    if (cpfLimpo.length !== 11 || !emailRecuperacao || String(novoPin).length !== 6) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados inválidos para recuperação.',
      });
    }

    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE cpf = ? AND email_recuperacao = ?',
      [cpfLimpo, emailRecuperacao]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensagem: 'CPF ou e-mail de recuperação não encontrado.',
      });
    }

    await pool.query(
      'UPDATE usuarios SET pin = ? WHERE cpf = ?',
      [novoPin, cpfLimpo]
    );

    return res.json({
      ok: true,
      mensagem: 'PIN redefinido com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao redefinir PIN.',
      erro: erro.message,
    });
  }
});

module.exports = router;