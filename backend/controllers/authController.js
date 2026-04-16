import jwt from 'jsonwebtoken';
import {
  create,
  read,
  hashPassword,
  comparePassword
} from '../config/database.js';

// POST /auth/registro - cria um novo usuário
const registro = async (req, res) => {
  try {
    const { nome, email, senha, nivel_acesso } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: nome, email, senha'
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const usuarios = await read('usuarios', `email = '${emailFormatado}'`);
    if (usuarios.length > 0) {
      return res.status(409).json({
        sucesso: false,
        erro: 'Email já cadastrado'
      });
    }

    const senhaHash = await hashPassword(senha);

    // A coluna no banco é 'senha_hash'
    const usuarioId = await create('usuarios', {
      nome: nome.trim(),
      email: emailFormatado,
      senha_hash: senhaHash,
      nivel_acesso: nivel_acesso || 'cliente'
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso',
      dados: {
        id: usuarioId,
        nome,
        email: emailFormatado
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// POST /auth/login - autentica e retorna JWT
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: email, senha'
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const usuarios = await read('usuarios', `email = '${emailFormatado}'`);
    if (usuarios.length === 0) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Credenciais inválidas'
      });
    }

    const usuario = usuarios[0];

    // Usa o campo 'senha_hash' que é o nome da coluna no banco
    const senhaValida = await comparePassword(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Credenciais inválidas'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      dados: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          nivel_acesso: usuario.nivel_acesso
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

export default { registro, login };