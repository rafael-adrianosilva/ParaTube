# 🚀 Guia Rápido de Instalação - ParaTube

## ⚡ Instalação Rápida (5 minutos)

### Passo 1: Requisitos
- ✅ XAMPP, WAMP ou similar instalado
- ✅ Navegador moderno (Chrome, Firefox, Edge)

### Passo 2: Copiar Projeto
```bash
# Copie a pasta para:
C:\xampp\htdocs\paratube
# ou
C:\wamp64\www\paratube
```

### Passo 3: Configurar Banco de Dados
1. Abra o **phpMyAdmin** em: `http://localhost/phpmyadmin`
2. Clique em **"Novo"** ou **"New"**
3. Clique em **"Importar"** ou **"Import"**
4. Selecione o arquivo `database.sql`
5. Clique em **"Executar"** ou **"Go"**

✅ Pronto! O banco `paratube` foi criado!

### Passo 4: Iniciar Servidor
1. Abra o **XAMPP Control Panel**
2. Clique em **"Start"** no Apache
3. Clique em **"Start"** no MySQL

### Passo 5: Acessar o Site
Abra seu navegador e acesse:
```
http://localhost/paratube
```

## 🎉 Está Funcionando!

### Teste o Login
Use um dos usuários de exemplo:

**Usuário 1:**
- Email: `codemaster@example.com`
- Senha: `password`

**Usuário 2:**
- Email: `webdesign@example.com`
- Senha: `password`

### O que você pode fazer:
- ✅ Ver vídeos de exemplo
- ✅ Fazer login/logout
- ✅ Alternar tema claro/escuro
- ✅ Buscar vídeos
- ✅ Adicionar comentários
- ✅ Dar like/dislike
- ✅ Fazer upload de vídeos (após login)

## 🔧 Problemas Comuns

### Erro "Cannot connect to database"
**Solução:**
1. Verifique se o MySQL está rodando no XAMPP
2. Abra `php/config.php`
3. Verifique se as credenciais estão corretas:
```php
define('DB_USER', 'root');
define('DB_PASS', ''); // deixe vazio se não tem senha
```

### Página em branco
**Solução:**
1. Verifique se o Apache está rodando
2. Acesse `http://localhost/paratube/index.html` (com index.html)

### Upload de vídeo não funciona
**Solução:**
1. Verifique se a pasta `uploads/` existe
2. No Windows, não precisa de permissões especiais
3. Verifique o tamanho máximo no `.htaccess`

## 📱 Próximos Passos

1. **Explore o site**
   - Navegue pelas páginas
   - Teste as funcionalidades
   - Mude o tema

2. **Faça upload de um vídeo**
   - Faça login primeiro
   - Clique no ícone de câmera
   - Selecione um vídeo MP4

3. **Personalize**
   - Modifique as cores em `css/style.css`
   - Adicione seu logo
   - Customize os textos

## 💻 Desenvolvimento

### Editar o projeto:
Recomendado: **VS Code**
```bash
code .
```

### Ver erros PHP:
Abra: `C:\xampp\apache\logs\error.log`

### Estrutura de pastas:
```
paratube/
├── index.html          # Página principal
├── watch.html          # Player de vídeo
├── login.html          # Login
├── register.html       # Cadastro
├── css/
│   └── style.css      # Estilos
├── js/
│   ├── main.js        # JavaScript principal
│   ├── watch.js       # Player
│   └── auth.js        # Autenticação
├── php/
│   ├── *.php          # APIs backend
└── uploads/           # Vídeos enviados
```

## 🎨 Personalização Rápida

### Mudar o nome do site:
Busque e substitua "ParaTube" por seu nome

### Mudar as cores:
Edite `css/style.css` linha 8-15:
```css
:root {
    --accent-color: #ff0000;  /* Cor principal */
}
```

### Adicionar seu logo:
Coloque uma imagem em `assets/logo.png` e substitua o ícone

## 📞 Suporte

Problemas? Verifique:
1. ✅ Apache está rodando?
2. ✅ MySQL está rodando?
3. ✅ Banco de dados foi importado?
4. ✅ Está acessando a URL correta?

## 🎓 Aprender Mais

- Leia `README.md` para detalhes completos
- Veja `MCP_USAGE.md` para entender o desenvolvimento
- Explore o código com comentários

---

**Pronto para usar! 🚀**

Divirta-se com seu clone do YouTube!
