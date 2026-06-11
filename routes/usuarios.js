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
      nomeUsuario,
      cpf,
      emailRecuperacao,
      pin,
      dataNascimento,
      tipoDiabetes,
    } = req.body;

    const cpfLimpo = limparCpf(cpf);
    const nomeUsuarioLimpo = String(nomeUsuario || '').trim().toLowerCase();

    if (
      !nome ||
      !nomeUsuarioLimpo ||
      cpfLimpo.length !== 11 ||
      !emailRecuperacao ||
      !pin ||
      !dataNascimento
    ) {
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

    const [existenteCpf] = await pool.query(
      'SELECT id FROM usuarios WHERE cpf = ?',
      [cpfLimpo]
    );

    if (existenteCpf.length > 0) {
      return res.status(409).json({
        ok: false,
        mensagem: 'CPF já cadastrado.',
      });
    }

    const [existenteUsuario] = await pool.query(
      'SELECT id FROM usuarios WHERE nome_usuario = ?',
      [nomeUsuarioLimpo]
    );

    if (existenteUsuario.length > 0) {
      return res.status(409).json({
        ok: false,
        mensagem: 'Nome de usuário já utilizado.',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO usuarios
      (nome, nome_usuario, cpf, email_recuperacao, pin, data_nascimento, tipo_diabetes, usa_insulina)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        nomeUsuarioLimpo,
        cpfLimpo,
        emailRecuperacao,
        pin,
        dataNascimento,
        tipoDiabetes || 'Não informado',
        0,
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
        nomeUsuario: nomeUsuarioLimpo,
        cpf: cpfLimpo,
        emailRecuperacao,
        dataNascimento,
        tipoDiabetes: tipoDiabetes || 'Não informado',
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
    const { nomeUsuario, pin } = req.body;
    const nomeUsuarioLimpo = String(nomeUsuario || '').trim().toLowerCase();

    const [usuarios] = await pool.query(
      `SELECT id, nome, nome_usuario, cpf, email_recuperacao, data_nascimento,
              tipo_diabetes, data_criacao
       FROM usuarios
       WHERE nome_usuario = ? AND pin = ?`,
      [nomeUsuarioLimpo, pin]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        ok: false,
        mensagem: 'Usuário ou PIN inválido.',
      });
    }

    const usuario = usuarios[0];

    return res.json({
      ok: true,
      mensagem: 'Login realizado com sucesso.',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        nomeUsuario: usuario.nome_usuario,
        cpf: usuario.cpf,
        emailRecuperacao: usuario.email_recuperacao,
        dataNascimento: usuario.data_nascimento,
        tipoDiabetes: usuario.tipo_diabetes,
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
    const {
      nomeUsuario,
      emailRecuperacao,
      novoPin,
    } = req.body;

    const nomeUsuarioLimpo =
      String(nomeUsuario || '').trim().toLowerCase();

    if (
      !nomeUsuarioLimpo ||
      !emailRecuperacao ||
      String(novoPin).length !== 6
    ) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados inválidos para recuperação.',
      });
    }

    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE nome_usuario = ? AND email_recuperacao = ?',
      [nomeUsuarioLimpo, emailRecuperacao]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensagem: 'Usuário ou e-mail de recuperação não encontrado.',
      });
    }

    await pool.query(
      'UPDATE usuarios SET pin = ? WHERE nome_usuario = ?',
      [novoPin, nomeUsuarioLimpo]
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

router.put('/perfil/:cpf', async (req, res) => {
  try {
    const cpfLimpo = limparCpf(req.params.cpf);

    const {
      nome,
      emailRecuperacao,
      tipoDiabetes,
      dataNascimento,
    } = req.body;

    if (
      !nome ||
      !emailRecuperacao ||
      !tipoDiabetes ||
      !dataNascimento
    ) {
      return res.status(400).json({
        ok: false,
        mensagem: 'Dados obrigatórios não informados.',
      });
    }

    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE cpf = ?',
      [cpfLimpo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensagem: 'Usuário não encontrado.',
      });
    }

    await pool.query(
      `UPDATE usuarios
       SET nome = ?,
           email_recuperacao = ?,
           tipo_diabetes = ?,
           data_nascimento = ?
       WHERE cpf = ?`,
      [
        nome,
        emailRecuperacao,
        tipoDiabetes,
        dataNascimento,
        cpfLimpo,
      ]
    );

    return res.json({
      ok: true,
      mensagem: 'Perfil atualizado com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      ok: false,
      mensagem: 'Erro ao atualizar perfil.',
      erro: erro.message,
    });
  }
});
module.exports = router;