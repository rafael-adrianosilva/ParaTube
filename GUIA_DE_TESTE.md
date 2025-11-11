# 🧪 GUIA DE TESTE - PARATUBE

## ⚡ TESTE RÁPIDO (5 minutos)

### Pré-requisitos
- XAMPP rodando (Apache + MySQL)
- Banco de dados configurado
- Usuário cadastrado no sistema

---

## 📝 ROTEIRO DE TESTES

### ✅ TESTE 1: Sistema de Inscrições (2 min)

**Passo a passo:**
```
1. Abrir navegador → http://localhost/testebenebides/
2. Fazer login
3. Clicar em qualquer vídeo
4. Localizar botão "INSCREVER-SE" abaixo do vídeo
5. Clicar no botão
   ✓ Deve mudar para "INSCRITO"
   ✓ Ícone de sino deve aparecer
6. Clicar novamente
   ✓ Deve voltar para "INSCREVER-SE"
7. Abrir DevTools (F12) → Console
   ✓ Ver logs: "✅ Subscribed successfully" ou "✅ Unsubscribed successfully"
```

**Resultado esperado:**
- ✅ Botão alterna entre estados
- ✅ Sem erros no console
- ✅ Mensagens de debug aparecem

---

### ✅ TESTE 2: Página "Seu Canal" (1 min)

**Passo a passo:**
```
1. Estando logado, clicar em "Seu canal" no menu lateral
2. Verificar se a página carrega
   ✓ Banner aparece (se configurado)
   ✓ Foto de perfil aparece
   ✓ Nome do canal está correto
   ✓ Contador de inscritos/vídeos aparece
3. Verificar aba "Vídeos"
   ✓ Vídeos enviados são listados
   ✓ Thumbnails carregam
4. Verificar aba "Sobre"
   ✓ Descrição do canal aparece
   ✓ Data de inscrição aparece
```

**Resultado esperado:**
- ✅ Página carrega completamente
- ✅ Todos os elementos visíveis
- ✅ Sem mensagens "Nenhum vídeo publicado" (se houver vídeos)

---

### ✅ TESTE 3: Troca de Banner (2 min)

**Passo a passo:**
```
1. Na página "Seu canal", clicar em "Personalizar canal"
2. Na seção "Banner do canal", clicar em "Enviar banner"
3. Selecionar uma imagem (JPG/PNG)
4. Verificar preview
   ✓ Imagem aparece na pré-visualização
5. Clicar em "Publicar"
6. Aguardar redirecionamento para "Seu canal"
   ✓ Banner novo está aplicado
7. Recarregar página (F5)
   ✓ Banner ainda está lá
8. Abrir DevTools → Network
   ✓ Requisição para get-channel-customization.php retorna 200
```

**Resultado esperado:**
- ✅ Upload funciona
- ✅ Banner salvo em `uploads/banners/`
- ✅ Banner persiste após reload
- ✅ Sem erros 404 ou 500

---

### ✅ TESTE 4: Visualizar Canal de Outros (1 min)

**Passo a passo:**
```
1. Ir para página inicial
2. Clicar em qualquer vídeo
3. Clicar na foto de perfil ou nome do canal (do autor do vídeo)
4. Verificar se página do canal abre
   ✓ Não aparece erro "Erro ao carregar canal!"
   ✓ Nome do canal aparece
   ✓ Vídeos públicos do canal são listados
5. Clicar em "Inscrever-se"
   ✓ Botão muda para "Inscrito"
6. DevTools → Console
   ✓ Log: "✅ Subscribed successfully"
```

**Resultado esperado:**
- ✅ Canal de terceiro abre sem erro
- ✅ Vídeos aparecem
- ✅ Botão de inscrição funciona

---

## 🔍 VERIFICAÇÃO DE ARQUIVOS

### Verificar uploads (se banner foi enviado):
```
c:\xampp\htdocs\testebenebides\uploads\
  └── banners\
      └── [arquivos de banner]
```

### Verificar banco de dados:
```sql
-- Ver inscrições
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10;

-- Ver customização de canal
SELECT * FROM channel_customization;

-- Ver usuários
SELECT id, username, profile_image FROM users;
```

---

## ⚠️ TROUBLESHOOTING

### Problema: "Erro ao carregar canal"
**Solução:**
- Verificar se `php/get-channel-customization.php` existe
- Verificar se tabela `channel_customization` existe no banco

### Problema: Banner não aparece
**Solução:**
- Verificar permissões da pasta `uploads/banners/` (deve ser 777)
- Verificar se caminho no banco está correto (sem `../`)
- F5 na página

### Problema: Inscrição não funciona
**Solução:**
- Verificar se `data-channel-id` está no elemento `channelName` (DevTools → Elements)
- Verificar console do navegador (F12)
- Verificar logs do PHP em `error_log`

---

## 📊 CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Sistema de inscrições funciona (subscribe/unsubscribe)
- [ ] Página "Seu Canal" carrega com conteúdo
- [ ] Banner pode ser enviado e salvo
- [ ] Banner persiste após reload
- [ ] Canal de terceiros abre sem erro
- [ ] Botão inscrever funciona em canal de terceiros
- [ ] Console sem erros JavaScript
- [ ] Network sem erros 404/500
- [ ] Banco de dados atualiza corretamente

---

## 🎯 COMANDOS ÚTEIS

### Limpar cache do navegador:
```
Ctrl + Shift + Delete (Chrome/Edge)
```

### Ver logs PHP (Windows XAMPP):
```
C:\xampp\apache\logs\error.log
```

### Reiniciar Apache:
```
XAMPP Control Panel → Apache → Stop → Start
```

---

**Status:** ✅ Todos os bugs corrigidos e prontos para teste!
