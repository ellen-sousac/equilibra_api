const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const rotasUsuarios = require('./routes/usuarios');
const rotasGlicemias = require('./routes/glicemias');
const rotasAnotacoes = require('./routes/anotacoes');
const rotasMedicamentos = require('./routes/medicamentos');
const rotasControleMedicamentos = require('./routes/controle_medicamentos');
const rotasHorariosRefeicoes = require('./routes/horarios_refeicoes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/usuarios', rotasUsuarios);
app.use('/glicemias', rotasGlicemias);
app.use('/anotacoes', rotasAnotacoes);
app.use('/medicamentos', rotasMedicamentos);
app.use('/controle-medicamentos', rotasControleMedicamentos);
app.use('/horarios-refeicoes', rotasHorariosRefeicoes);

app.get('/status', async (req, res) => {
  try {
    const [resultado] = await pool.query('SELECT 1 AS ok');

    res.json({
      ok: true,
      banco: resultado[0].ok === 1,
      mensagem: 'API Equilibra conectada ao MySQL.',
    });
  } catch (erro) {
    res.status(500).json({
      ok: false,
      mensagem: 'Erro ao conectar ao banco.',
      erro: erro.message,
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, '0.0.0.0', () => {
  console.log(`API Equilibra rodando na porta ${porta}`);
});