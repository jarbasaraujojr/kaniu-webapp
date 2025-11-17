# 🔐 Credenciais de Teste - Kaniu

## Usuários Criados pelo Seed

Todos os usuários têm a mesma senha: **`senha123`**

### 1. Administrador
- **Email**: `admin@kaniu.com`
- **Senha**: `senha123`
- **Role**: `admin`
- **Nome**: Admin Kaniu
- **Permissões**: Acesso total ao sistema

### 2. Gerente de Abrigo
- **Email**: `joao@abrigo.com`
- **Senha**: `senha123`
- **Role**: `shelter_manager`
- **Nome**: João Silva
- **Permissões**:
  - Gerenciar abrigos
  - Gerenciar animais
  - Aprovar adoções
  - Ver relatórios

### 3. Adotante
- **Email**: `maria@email.com`
- **Senha**: `senha123`
- **Role**: `adopter`
- **Nome**: Maria Santos
- **Permissões**:
  - Ver animais
  - Solicitar adoção
  - Adicionar favoritos

---

## Dados Populados

### Abrigos (2)
1. **Abrigo Amigos dos Animais**
   - Gerente: João Silva
   - Telefone: (11) 3333-4444
   - Email: contato@amigosanimais.org

2. **Refúgio Pet Feliz**
   - Gerente: João Silva
   - Telefone: (11) 5555-6666
   - Email: contato@petfeliz.org

### Animais (3)
1. **Rex** - Labrador, Macho, Grande (Abrigo Amigos dos Animais)
2. **Luna** - Siamês, Fêmea, Pequeno (Abrigo Amigos dos Animais)
3. **Toby** - Beagle, Macho, Médio (Refúgio Pet Feliz)

### Catálogos
- **Espécies**: Cão, Gato
- **Raças de Cães**: 15 raças (SRD, Labrador, Golden, Bulldog, etc.)
- **Raças de Gatos**: 10 raças (SRD, Persa, Siamês, Maine Coon, etc.)
- **Tamanhos**: Pequeno, Médio, Grande, Gigante

### Roles (5)
- admin
- shelter_manager
- veterinarian
- adopter
- volunteer

---

## Como Testar

1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000

3. Clique em "Fazer Login"

4. Use uma das credenciais acima

5. Explore o dashboard de acordo com o role do usuário

---

## Segurança

⚠️ **IMPORTANTE**:
- Estas são credenciais de DESENVOLVIMENTO apenas
- NUNCA use "senha123" em produção
- Sempre gere senhas fortes para usuários reais
- Mantenha este arquivo fora do controle de versão em produção

---

**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}
