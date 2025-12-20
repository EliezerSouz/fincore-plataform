# 📘 GUIA DE USO — Componentes de Input

**Versão:** 1.0.0  
**Data:** 2025-12-18

---

## 🎯 COMPONENTES DISPONÍVEIS

### 1. `<CurrencyInput />` - Valores Monetários

**Quando usar:**
- Valor de transação
- Limite de cartão
- Saldo de conta
- Qualquer valor em R$

**Características:**
- ✅ Inicia com "0,00"
- ✅ Formata automaticamente (1.234,56)
- ✅ Aceita apenas números
- ✅ Retorna `number` para backend

**Exemplo:**
```tsx
import { CurrencyInput } from "@/components/ui/currency-input"

function TransactionForm() {
  const [amount, setAmount] = useState(0)

  return (
    <CurrencyInput
      label="Valor"
      value={amount}
      onChange={setAmount}
      required
      min={0.01}
      max={999999.99}
    />
  )
}
```

---

### 2. `<TextInput />` - Texto Livre

**Quando usar:**
- Descrição de transação
- Nome de conta
- Nome de categoria
- Observações
- Notas
- Qualquer texto livre

**Características:**
- ✅ Preserva entrada do usuário
- ❌ NÃO força UPPERCASE
- ❌ NÃO altera capitalização

**Exemplo:**
```tsx
import { TextInput } from "@/components/ui/text-input"

function TransactionForm() {
  const [description, setDescription] = useState("")

  return (
    <TextInput
      label="Descrição"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Ex: Compra no supermercado"
      required
      maxLength={255}
    />
  )
}
```

---

### 3. `<CodeInput />` - Códigos e Identificadores

**Quando usar:**
- Chave PIX
- Código TED/DOC
- CPF/CNPJ
- Códigos de barras
- Identificadores técnicos

**Características:**
- ✅ Força UPPERCASE automaticamente
- ✅ Remove espaços
- ✅ Fonte monoespaçada

**Exemplo:**
```tsx
import { CodeInput } from "@/components/ui/code-input"

function PixForm() {
  const [pixKey, setPixKey] = useState("")

  return (
    <CodeInput
      label="Chave PIX"
      value={pixKey}
      onChange={(e) => setPixKey(e.target.value)}
      placeholder="Digite a chave PIX"
      required
    />
  )
}
```

---

### 4. `<Input />` - Base (Uso Genérico)

**Quando usar:**
- Email
- Senha
- Telefone
- Campos especiais

**Características:**
- ✅ Componente base sem transformações
- ✅ Flexível para qualquer tipo

**Exemplo:**
```tsx
import { Input } from "@/components/ui/input"

function LoginForm() {
  const [email, setEmail] = useState("")

  return (
    <Input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="seu@email.com"
    />
  )
}
```

---

## 📊 TABELA DE DECISÃO

| Campo | Componente | Exemplo |
|-------|------------|---------|
| Valor da transação | `CurrencyInput` | R$ 1.234,56 |
| Descrição | `TextInput` | "Compra no mercado" |
| Nome da conta | `TextInput` | "Conta Corrente Nubank" |
| Nome da categoria | `TextInput` | "Alimentação" |
| Observações | `TextInput` | "Pago com cartão" |
| Chave PIX | `CodeInput` | "MINHACHAVE@EMAIL.COM" |
| CPF | `CodeInput` | "12345678900" |
| Email | `Input` type="email" | "user@example.com" |
| Senha | `Input` type="password" | "••••••••" |

---

## ✅ BOAS PRÁTICAS

### 1. Sempre use o componente certo

❌ **Errado:**
```tsx
<Input
  type="text"
  value={amount}
  onChange={(e) => setAmount(parseFloat(e.target.value))}
/>
```

✅ **Correto:**
```tsx
<CurrencyInput
  value={amount}
  onChange={setAmount}
/>
```

---

### 2. Não force transformações desnecessárias

❌ **Errado:**
```tsx
<Input
  value={description}
  onChange={(e) => setDescription(e.target.value.toUpperCase())}
/>
```

✅ **Correto:**
```tsx
<TextInput
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

---

### 3. Use validação apropriada

✅ **Correto:**
```tsx
const [amount, setAmount] = useState(0)
const [error, setError] = useState("")

const handleSubmit = () => {
  if (amount < 0.01) {
    setError("Valor mínimo: R$ 0,01")
    return
  }
  // Prosseguir...
}

return (
  <CurrencyInput
    value={amount}
    onChange={setAmount}
    error={error}
    min={0.01}
  />
)
```

---

## 🔄 MIGRAÇÃO DE CÓDIGO EXISTENTE

### Antes (Input genérico)
```tsx
<Input
  type="text"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Descrição"
/>
```

### Depois (TextInput especializado)
```tsx
<TextInput
  label="Descrição"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Ex: Compra no supermercado"
  required
  maxLength={255}
/>
```

---

## 🎨 PERSONALIZAÇÃO

Todos os componentes aceitam `className` para customização:

```tsx
<CurrencyInput
  value={amount}
  onChange={setAmount}
  className="bg-accent/10 border-2"
/>

<TextInput
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  className="font-semibold"
/>
```

---

## 🧪 TESTES

### Testar CurrencyInput

```tsx
it("should format currency correctly", () => {
  const { getByRole } = render(
    <CurrencyInput value={1234.56} onChange={jest.fn()} />
  )
  
  const input = getByRole("textbox")
  expect(input).toHaveValue("1.234,56")
})
```

### Testar TextInput

```tsx
it("should preserve user input", () => {
  const handleChange = jest.fn()
  const { getByRole } = render(
    <TextInput value="" onChange={handleChange} />
  )
  
  const input = getByRole("textbox")
  fireEvent.change(input, { target: { value: "Compra no Mercado" } })
  
  expect(handleChange).toHaveBeenCalledWith(
    expect.objectContaining({
      target: expect.objectContaining({
        value: "Compra no Mercado" // NÃO "COMPRA NO MERCADO"
      })
    })
  )
})
```

---

## ❓ FAQ

**P: Posso usar Input base para valores?**  
R: Não. Use sempre `CurrencyInput` para valores monetários.

**P: Como faço para forçar UPPERCASE em um campo?**  
R: Use `CodeInput` para códigos técnicos. Para textos livres, NÃO force UPPERCASE.

**P: O backend recebe string ou number?**  
R: `CurrencyInput` retorna `number`. `TextInput` e `CodeInput` retornam `string`.

**P: Posso adicionar máscara personalizada?**  
R: Sim, mas crie um componente especializado. Não modifique os componentes base.

---

## 📚 REFERÊNCIAS

- [PADRAO_INPUTS_FINANCEIROS.md](./PADRAO_INPUTS_FINANCEIROS.md) - Especificação completa
- [PADRAO_OFICIAL_DE_DADOS.md](./PADRAO_OFICIAL_DE_DADOS.md) - Padrão de dados

---

> **Última Atualização:** 2025-12-18  
> **Versão:** 1.0.0
