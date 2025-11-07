# 🤝 Guia de Contribuição - ParaTube

Obrigado por considerar contribuir para o ParaTube! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

1. [Como Contribuir](#como-contribuir)
2. [Padrões de Código](#padrões-de-código)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Processo de Pull Request](#processo-de-pull-request)
5. [Reportar Bugs](#reportar-bugs)
6. [Sugerir Melhorias](#sugerir-melhorias)

## 🚀 Como Contribuir

### 1. Fork o Projeto
```bash
# Clone seu fork
git clone https://github.com/seu-usuario/paratube.git
cd paratube
```

### 2. Crie uma Branch
```bash
# Para nova funcionalidade
git checkout -b feature/nova-funcionalidade

# Para correção de bug
git checkout -b fix/correcao-bug

# Para melhoria
git checkout -b improvement/melhoria
```

### 3. Faça suas Alterações
- Siga os padrões de código
- Comente seu código
- Teste localmente

### 4. Commit suas Mudanças
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

#### Padrões de Commit:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### 5. Push para o GitHub
```bash
git push origin feature/nova-funcionalidade
```

### 6. Abra um Pull Request
- Descreva suas mudanças
- Referencie issues relacionadas
- Aguarde revisão

## 📝 Padrões de Código

### HTML
```html
<!-- Use indentação de 4 espaços -->
<!-- Atributos em ordem alfabética -->
<!-- Sempre feche tags -->
<div class="container" id="main">
    <h1>Título</h1>
    <p>Parágrafo</p>
</div>
```

### CSS
```css
/* Use variáveis CSS */
/* Organize por seções */
/* Comente seções importantes */

/* ===== HEADER ===== */
.header {
    display: flex;
    background-color: var(--bg-primary);
    padding: 16px;
}

/* Mobile First */
@media (max-width: 768px) {
    .header {
        padding: 12px;
    }
}
```

### JavaScript
```javascript
// Use camelCase para variáveis e funções
// Use const/let ao invés de var
// Comente funções complexas

/**
 * Carrega vídeos do servidor
 * @returns {Promise<Array>} Lista de vídeos
 */
async function loadVideos() {
    try {
        const response = await fetch('php/get-videos.php');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}
```

### PHP
```php
<?php
// Use snake_case para variáveis
// Use camelCase para funções
// Sempre use prepared statements

function getVideoById($video_id) {
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("SELECT * FROM videos WHERE id = ?");
    $stmt->bind_param("i", $video_id);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_assoc();
}
?>
```

### SQL
```sql
-- Use UPPER_CASE para palavras-chave SQL
-- Use snake_case para tabelas e colunas
-- Sempre adicione índices relevantes

CREATE TABLE example_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
);
```

## 📂 Estrutura do Projeto

```
paratube/
├── index.html              # Página principal
├── watch.html              # Player de vídeo
├── login.html              # Login
├── register.html           # Registro
├── forgot-password.html    # Recuperação de senha
├── database.sql            # Schema do banco
├── README.md               # Documentação principal
├── QUICK_START.md          # Guia rápido
├── FEATURES.md             # Lista de funcionalidades
├── TROUBLESHOOTING.md      # Solução de problemas
├── MCP_USAGE.md            # Uso de MCPs
├── CONTRIBUTING.md         # Este arquivo
├── .htaccess               # Configuração Apache
├── .gitignore              # Arquivos ignorados
├── css/
│   └── style.css          # Estilos principais
├── js/
│   ├── main.js            # JavaScript principal
│   ├── watch.js           # Player
│   └── auth.js            # Autenticação
├── php/
│   ├── config.php         # Configuração
│   ├── *.php              # APIs
└── uploads/               # Vídeos enviados
```

## 🔄 Processo de Pull Request

### Antes de Enviar:

1. ✅ Código testado localmente
2. ✅ Sem erros no console
3. ✅ Segue padrões de código
4. ✅ Documentação atualizada
5. ✅ Commits bem descritos

### Revisão:

- PRs serão revisados em até 48 horas
- Podem ser solicitadas alterações
- Após aprovação, será feito merge

### Checklist do PR:

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Testado em:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Screenshots (se aplicável)
```

## 🐛 Reportar Bugs

### Template de Bug Report:

```markdown
**Descrição do Bug**
Descrição clara e concisa do bug

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer

**Comportamento Atual**
O que está acontecendo

**Screenshots**
Se aplicável, adicione screenshots

**Ambiente:**
- OS: [ex: Windows 10]
- Navegador: [ex: Chrome 98]
- Versão PHP: [ex: 7.4]
- Versão MySQL: [ex: 5.7]

**Informações Adicionais**
Qualquer contexto adicional
```

## 💡 Sugerir Melhorias

### Template de Feature Request:

```markdown
**Funcionalidade Desejada**
Descrição clara da funcionalidade

**Problema que Resolve**
Qual problema esta funcionalidade resolve?

**Solução Proposta**
Como você imagina que funcionaria?

**Alternativas Consideradas**
Outras soluções que pensou?

**Contexto Adicional**
Screenshots, mockups, etc.
```

## 🎯 Áreas que Precisam de Ajuda

### Alta Prioridade:
- [ ] Sistema de notificações
- [ ] Transmissão ao vivo
- [ ] Playlists
- [ ] Analytics

### Média Prioridade:
- [ ] Compartilhamento social
- [ ] Sistema de mensagens
- [ ] Perfil de usuário completo
- [ ] Temas personalizados

### Baixa Prioridade:
- [ ] Traduções (i18n)
- [ ] PWA
- [ ] App mobile
- [ ] Integração com redes sociais

## 📚 Recursos Úteis

### Documentação:
- [PHP Manual](https://www.php.net/manual/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Ferramentas:
- [Visual Studio Code](https://code.visualstudio.com/)
- [XAMPP](https://www.apachefriends.org/)
- [phpMyAdmin](https://www.phpmyadmin.net/)
- [Postman](https://www.postman.com/)

### Comunidade:
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Discussions](https://github.com/)
- [Reddit r/webdev](https://reddit.com/r/webdev)

## 🏆 Reconhecimento

Todos os contribuidores serão listados no README.md

### Níveis de Contribuição:

- 🥉 **Bronze**: 1-5 PRs aceitos
- 🥈 **Prata**: 6-15 PRs aceitos
- 🥇 **Ouro**: 16+ PRs aceitos
- 💎 **Diamante**: Contribuidor regular

## ❓ Dúvidas?

Se tiver dúvidas sobre como contribuir:

1. Leia a documentação completa
2. Veja PRs anteriores como exemplo
3. Abra uma issue para discussão
4. Entre em contato com mantenedores

## 📜 Código de Conduta

### Nosso Compromisso:

Estamos comprometidos em fornecer uma experiência acolhedora e inclusiva para todos.

### Comportamento Esperado:

- 🤝 Seja respeitoso e inclusivo
- 💬 Use linguagem acolhedora
- 🎯 Foque no que é melhor para a comunidade
- 👂 Aceite críticas construtivas

### Comportamento Inaceitável:

- ❌ Linguagem ou imagens ofensivas
- ❌ Assédio público ou privado
- ❌ Ataques pessoais ou políticos
- ❌ Conduta não profissional

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir! 🎉**

Seu tempo e esforço ajudam a tornar o ParaTube melhor para todos.
