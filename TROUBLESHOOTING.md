# 🔧 Guia de Solução de Problemas - ParaTube

## 🚨 Problemas Comuns e Soluções

### 1. Erro: "Cannot connect to database"

**Causa**: MySQL não está rodando ou credenciais incorretas

**Soluções**:
```
✓ Verifique se o MySQL está rodando no XAMPP/WAMP
✓ Abra php/config.php e confirme:
  - DB_HOST = 'localhost'
  - DB_USER = 'root'
  - DB_PASS = '' (vazio para XAMPP/WAMP padrão)
  - DB_NAME = 'paratube'
✓ Verifique se o banco 'paratube' foi criado
✓ Reimporte o database.sql se necessário
```

### 2. Página em Branco ou Erro 500

**Causa**: Erro de PHP ou arquivo config.php ausente

**Soluções**:
```
✓ Copie config.example.php para config.php
✓ Verifique logs de erro:
  - XAMPP: C:\xampp\apache\logs\error.log
  - WAMP: C:\wamp64\logs\apache_error.log
✓ Ative display_errors em php/config.php:
  ini_set('display_errors', 1);
```

### 3. Upload de Vídeo Falha

**Causa**: Tamanho de arquivo, permissões ou tipo inválido

**Soluções**:
```
✓ Verifique se a pasta uploads/ existe
✓ Confirme o tamanho do arquivo (limite: 500MB)
✓ Use apenas arquivos MP4, WebM ou OGG
✓ Aumente limites no .htaccess:
  php_value upload_max_filesize 500M
  php_value post_max_size 500M
✓ Verifique php.ini:
  upload_max_filesize = 500M
  post_max_size = 500M
  max_execution_time = 300
```

### 4. Login Não Funciona

**Causa**: Sessões não configuradas ou banco sem dados

**Soluções**:
```
✓ Certifique-se de que session_start() está sendo chamado
✓ Use credenciais de teste:
  Email: codemaster@example.com
  Senha: password
✓ Limpe cookies e cache do navegador
✓ Verifique se a tabela 'users' tem dados
✓ Teste com um novo registro
```

### 5. Vídeos Não Aparecem

**Causa**: Banco vazio ou erro na consulta

**Soluções**:
```
✓ Verifique se importou o database.sql
✓ Confirme que há vídeos na tabela 'videos'
✓ Abra: http://localhost/paratube/php/get-videos.php
✓ Deve retornar JSON com vídeos
✓ Verifique console do navegador (F12) para erros
```

### 6. Tema Não Muda

**Causa**: JavaScript não carregou ou localStorage bloqueado

**Soluções**:
```
✓ Abra console do navegador (F12)
✓ Verifique se há erros JavaScript
✓ Confirme que js/main.js está carregando
✓ Teste em modo anônimo/privado
✓ Limpe localStorage:
  localStorage.clear()
```

### 7. CSS Não Carrega / Design Quebrado

**Causa**: Caminho incorreto ou cache

**Soluções**:
```
✓ Limpe cache do navegador (Ctrl+Shift+Del)
✓ Force reload (Ctrl+F5)
✓ Verifique se css/style.css existe
✓ Abra: http://localhost/paratube/css/style.css
✓ Verifique caminhos nos arquivos HTML
```

### 8. Ícones Não Aparecem

**Causa**: Font Awesome não carregou

**Soluções**:
```
✓ Verifique conexão com internet
✓ CDN do Font Awesome pode estar fora
✓ Baixe Font Awesome localmente
✓ Adicione na pasta assets/
✓ Atualize links nos arquivos HTML
```

### 9. Comentários Não Salvam

**Causa**: Não logado ou erro na API

**Soluções**:
```
✓ Faça login primeiro
✓ Verifique se user_id está na sessão
✓ Abra console (F12) e veja erros
✓ Teste: http://localhost/paratube/php/add-comment.php
✓ Verifique tabela 'comments' no banco
```

### 10. Erro 404 nas APIs

**Causa**: .htaccess ou mod_rewrite

**Soluções**:
```
✓ Certifique-se que .htaccess está na raiz
✓ Verifique se mod_rewrite está habilitado
✓ XAMPP: geralmente está habilitado
✓ Acesse diretamente:
  http://localhost/paratube/php/get-videos.php
```

## 🔍 Ferramentas de Debug

### Console do Navegador
```javascript
// Abra com F12
// Veja erros JavaScript
// Verifique requisições na aba Network
```

### Ver Resposta das APIs
```javascript
// No console do navegador:
fetch('http://localhost/paratube/php/get-videos.php')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Verificar Sessão
```php
// Adicione em qualquer arquivo PHP:
<?php
session_start();
var_dump($_SESSION);
?>
```

### Verificar Banco de Dados
```sql
-- No phpMyAdmin, execute:
SELECT * FROM users LIMIT 5;
SELECT * FROM videos LIMIT 5;
SELECT * FROM comments LIMIT 5;
```

## 📊 Checklist de Verificação

### Antes de Reportar um Bug:

- [ ] Apache está rodando?
- [ ] MySQL está rodando?
- [ ] Banco de dados foi importado?
- [ ] Arquivo config.php existe e está configurado?
- [ ] Pasta uploads/ existe?
- [ ] Limpou cache do navegador?
- [ ] Testou em outro navegador?
- [ ] Verificou console para erros?
- [ ] Verificou logs do Apache?

## 🛠️ Comandos Úteis

### Verificar Status do Apache/MySQL (Linux)
```bash
sudo service apache2 status
sudo service mysql status
```

### Reiniciar Serviços (Linux)
```bash
sudo service apache2 restart
sudo service mysql restart
```

### Ver Logs em Tempo Real (Linux)
```bash
tail -f /var/log/apache2/error.log
```

### Testar PHP
```bash
php -v
php -m  # Ver módulos instalados
```

### Verificar Permissões (Linux)
```bash
ls -la uploads/
chmod 755 uploads/
```

## 📞 Onde Buscar Ajuda

### 1. Documentação Oficial
- PHP: https://www.php.net/manual/
- MySQL: https://dev.mysql.com/doc/
- JavaScript: https://developer.mozilla.org/

### 2. Comunidades
- Stack Overflow (em português)
- Fóruns do XAMPP
- Reddit r/webdev

### 3. Logs do Sistema
- Sempre verifique os logs primeiro
- Eles geralmente indicam o problema exato

## 🎯 Modo Debug

### Ativar em config.php:
```php
define('DEBUG_MODE', true);
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Desativar em Produção:
```php
define('DEBUG_MODE', false);
error_reporting(0);
ini_set('display_errors', 0);
```

## 💡 Dicas de Performance

### Se o site está lento:

1. **Otimize o banco**:
```sql
OPTIMIZE TABLE videos;
OPTIMIZE TABLE comments;
```

2. **Adicione índices**:
```sql
CREATE INDEX idx_title ON videos(title);
```

3. **Ative cache**:
- Configure no .htaccess
- Use Memcached ou Redis

4. **Minifique arquivos**:
- CSS: use um minificador online
- JS: use UglifyJS ou similar

## 🔐 Problemas de Segurança

### Se suspeitar de invasão:

1. Mude todas as senhas
2. Atualize o banco de dados
3. Verifique logs de acesso
4. Implemente HTTPS
5. Adicione proteção CSRF
6. Configure firewall

## 📝 Registro de Problemas

Se encontrar um bug não listado:

1. Anote o comportamento esperado
2. Anote o comportamento atual
3. Liste os passos para reproduzir
4. Inclua mensagens de erro
5. Anote versão do PHP/MySQL
6. Tire screenshots se necessário

---

**Ainda com problemas?**

Revise este guia completamente e verifique todos os itens do checklist.
A maioria dos problemas está relacionada a configuração incorreta ou serviços não iniciados.

**Boa sorte! 🚀**
