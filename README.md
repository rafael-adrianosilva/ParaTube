# ParaTube - Clone do YouTube

Uma réplica completa do YouTube desenvolvida com HTML, CSS, JavaScript e PHP.

## 🚀 Funcionalidades

- ✅ Sistema de autenticação (Login, Registro, Recuperação de senha)
- ✅ Upload de vídeos
- ✅ Player de vídeo com controles
- ✅ Sistema de comentários
- ✅ Like/Dislike em vídeos
- ✅ Sistema de inscrições
- ✅ Busca de vídeos
- ✅ Filtros por categoria
- ✅ Tema claro e escuro
- ✅ Design responsivo
- ✅ Vídeos relacionados
- ✅ Histórico de visualizações

## 📋 Pré-requisitos

- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Servidor Apache/Nginx (XAMPP, WAMP, ou similar)
- Navegador moderno

## 🔧 Instalação

### 1. Clone ou baixe o projeto

```bash
git clone [seu-repositorio]
cd paratube
```

### 2. Configure o banco de dados

1. Abra o phpMyAdmin ou MySQL Workbench
2. Execute o arquivo `database.sql` para criar o banco de dados e tabelas
3. O banco de dados `paratube` será criado automaticamente

### 3. Configure a conexão com o banco

Edite o arquivo `php/config.php` e ajuste as credenciais:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // seu usuário MySQL
define('DB_PASS', '');            // sua senha MySQL
define('DB_NAME', 'paratube');
```

### 4. Configure o servidor

#### Usando XAMPP:

1. Copie o projeto para `C:\xampp\htdocs\paratube`
2. Inicie o Apache e MySQL pelo painel do XAMPP
3. Acesse: `http://localhost/paratube`

#### Usando WAMP:

1. Copie o projeto para `C:\wamp64\www\paratube`
2. Inicie o WAMP
3. Acesse: `http://localhost/paratube`

#### Usando servidor embutido do PHP:

```bash
cd paratube
php -S localhost:8000
```

Acesse: `http://localhost:8000`

### 5. Permissões (Linux/Mac)

```bash
chmod 755 uploads/
chmod 755 php/
```

## 👤 Usuários de Teste

O banco de dados vem com usuários de exemplo:

- **Email:** codemaster@example.com
- **Senha:** password

## 📁 Estrutura do Projeto

```
paratube/
├── index.html              # Página principal
├── watch.html              # Página do player
├── login.html              # Página de login
├── register.html           # Página de registro
├── forgot-password.html    # Recuperação de senha
├── database.sql            # Script do banco de dados
├── css/
│   └── style.css          # Estilos principais
├── js/
│   ├── main.js            # JavaScript principal
│   ├── watch.js           # JavaScript do player
│   └── auth.js            # JavaScript de autenticação
├── php/
│   ├── config.php         # Configuração do banco
│   ├── login.php          # API de login
│   ├── register.php       # API de registro
│   ├── forgot-password.php # API de recuperação
│   ├── upload-video.php   # API de upload
│   ├── get-videos.php     # API de listagem
│   ├── get-video.php      # API de vídeo único
│   ├── get-comments.php   # API de comentários
│   └── add-comment.php    # API de adicionar comentário
├── uploads/               # Pasta de vídeos
└── assets/                # Imagens e recursos
```

## 🎨 Características

### Tema Escuro/Claro
- Alternância automática de tema
- Preferência salva no localStorage

### Sistema de Upload
- Suporte para MP4, WebM, OGG
- Barra de progresso
- Validação de arquivos

### Player de Vídeo
- Controles nativos do HTML5
- Incremento automático de visualizações
- Sistema de like/dislike

### Comentários
- Adicionar comentários em tempo real
- Sistema de likes em comentários
- Ordenação por data

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 (Flexbox, Grid, Variables)
  - JavaScript (ES6+)
  - Font Awesome (ícones)

- **Backend:**
  - PHP 7+
  - MySQL
  - PDO/MySQLi

## 📱 Responsividade

O site é totalmente responsivo e funciona em:
- Desktop (1920px+)
- Laptop (1024px)
- Tablet (768px)
- Mobile (480px)

## 🔐 Segurança

- Senhas criptografadas com `password_hash()`
- Proteção contra SQL Injection (prepared statements)
- Validação de uploads
- Sessões seguras
- CSRF protection (a implementar)

## 🚧 Melhorias Futuras

- [ ] Sistema de notificações
- [ ] Chat ao vivo
- [ ] Playlists
- [ ] Compartilhamento social
- [ ] Analytics do canal
- [ ] Monetização
- [ ] Transmissão ao vivo
- [ ] Legendas
- [ ] Qualidade de vídeo ajustável

## 📄 Licença

Este projeto é de código aberto para fins educacionais.

## 👨‍💻 Desenvolvido usando Context7 e SequentialThinking MCP

Este projeto foi desenvolvido utilizando as ferramentas MCP (Model Context Protocol):
- **Context7**: Para gerenciamento de contexto e planejamento
- **SequentialThinking**: Para pensamento sequencial e resolução de problemas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o Apache e MySQL estão rodando
2. Confira as credenciais do banco em `php/config.php`
3. Verifique os logs de erro do PHP
4. Certifique-se de que a pasta `uploads/` tem permissões de escrita

## 🎉 Pronto!

Acesse o site e comece a usar o ParaTube!
