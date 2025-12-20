# 🏦 PADRÃO DE INPUTS — FINCORE PLATFORM

**Versão:** 1.0.0  
**Data:** 2025-12-18  
**Tipo:** Especificação Técnica

---

## 🎯 OBJETIVO

Padronizar comportamento de inputs financeiros seguindo **melhores práticas bancárias** e **UX moderna**, garantindo:

- ✅ Valores sempre corretos e formatados
- ✅ Textos preservados como digitados
- ✅ Dados prontos para relatórios e IA
- ✅ Experiência consistente em todo o sistema

---

## 💰 PADRÃO DE CAMPOS DE VALOR

### Regras de Negócio

1. **Inicialização**
   - Campo SEMPRE inicia com `"0,00"`
   - NUNCA iniciar vazio ou com placeholder
   - Valor padrão visível e claro

2. **Digitação**
   - Usuário digita APENAS números (0-9)
   - Sistema formata automaticamente
   - Não aceita: `,` `.` `-` ou letras

3. **Formatação Visual**
   - Separador decimal: `,` (vírgula)
   - Separador de milhar: `.` (ponto)
   - Sempre 2 casas decimais
   - Exemplos:
     - `1234` → `"12,34"`
     - `123456` → `"1.234,56"`
     - `1234567890` → `"12.345.678,90"`

4. **Persistência**
   - Backend recebe: `number` (ex: `1234.56`)
   - NUNCA enviar string formatada
   - Banco: `DECIMAL(15,2)`

5. **Validação**
   - Mínimo: `0,01` (não permitir zero em campos obrigatórios)
   - Máximo: `999.999.999,99` (15 dígitos, 2 decimais)
   - Valores negativos: usar campo separado ou tipo de transação

---

### Implementação

```typescript
// Hook personalizado para valores monetários
export function useCurrencyInput(initialValue: number = 0) {
  const [displayValue, setDisplayValue] = useState(formatCurrency(initialValue));
  const [numericValue, setNumericValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo exceto números
    const numbers = e.target.value.replace(/\D/g, '');
    
    // Converte para centavos
    const cents = parseInt(numbers || '0', 10);
    const value = cents / 100;
    
    // Atualiza valores
    setNumericValue(value);
    setDisplayValue(formatCurrency(value));
  };

  return { displayValue, numericValue, handleChange };
}

// Função de formatação
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

---

## 📝 PADRÃO DE CAMPOS DE TEXTO

### Regras de Negócio

1. **Preservação de Entrada**
   - ❌ NUNCA forçar UPPERCASE
   - ❌ NUNCA alterar capitalização durante digitação
   - ✅ Preservar EXATAMENTE como usuário digitou

2. **Campos Afetados**
   - Descrição de transação
   - Nome de conta
   - Nome de categoria customizada
   - Observações
   - Notas
   - Títulos
   - Qualquer texto livre

3. **Formatação Visual (Opcional)**
   - Pode aplicar `text-transform: capitalize` no CSS
   - APENAS visual, não altera o valor
   - NUNCA persistir texto formatado

4. **Normalização para Busca**
   - Criar campo auxiliar no backend (se necessário)
   - Usar `LOWER()` ou `UNACCENT()` no SQL
   - Campo original permanece intocado

---

### Implementação

```typescript
// Input de texto padrão (SEM transformação)
<Input
  type="text"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Digite a descrição"
  // NÃO usar uppercase, NÃO transformar
/>
```

---

## 🔤 EXCEÇÕES: UPPERCASE OBRIGATÓRIO

### Quando Usar UPPERCASE

Apenas para **dados técnicos**:

- ✅ Enums (status, tipos)
- ✅ Códigos (PIX, TED, DOC)
- ✅ Siglas (CPF, CNPJ)
- ✅ Identificadores técnicos

### Implementação

```typescript
// Input para códigos/enums
<Input
  type="text"
  value={code}
  onChange={(e) => setCode(e.target.value.toUpperCase())}
  placeholder="PIX, TED, DOC"
  className="uppercase"
/>
```

---

## 🎨 COMPONENTES PADRONIZADOS

### 1. CurrencyInput

```typescript
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  required = false,
  min = 0.01,
  max = 999999999.99,
  disabled = false,
}: CurrencyInputProps) {
  const { displayValue, numericValue, handleChange } = useCurrencyInput(value);

  useEffect(() => {
    onChange(numericValue);
  }, [numericValue, onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className="pl-10 text-right tabular-nums"
          aria-label={label}
        />
      </div>
    </div>
  );
}
```

---

### 2. TextInput (Preserva Entrada)

```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  maxLength,
  disabled = false,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        // NÃO forçar uppercase
        // NÃO transformar texto
        className="w-full"
      />
    </div>
  );
}
```

---

### 3. CodeInput (UPPERCASE)

```typescript
interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CodeInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
}: CodeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full uppercase"
      />
    </div>
  );
}
```

---

## 📊 TABELA DE REFERÊNCIA

| Campo | Tipo | Componente | Uppercase? | Formatação |
|-------|------|------------|------------|------------|
| Valor de transação | Numérico | `CurrencyInput` | N/A | `1.234,56` |
| Descrição | Texto livre | `TextInput` | ❌ Não | Preservar |
| Nome de conta | Texto livre | `TextInput` | ❌ Não | Preservar |
| Nome de categoria | Texto livre | `TextInput` | ❌ Não | Preservar |
| Observações | Texto livre | `TextInput` | ❌ Não | Preservar |
| Tipo de transação | Enum | `Select` | ✅ Sim | UPPERCASE |
| Status | Enum | `Select` | ✅ Sim | UPPERCASE |
| Código PIX | Código | `CodeInput` | ✅ Sim | UPPERCASE |
| CPF/CNPJ | Código | `CodeInput` | ✅ Sim | UPPERCASE |

---

## 🔍 VALIDAÇÕES

### Valores Monetários

```typescript
const validateCurrency = (value: number): string | null => {
  if (value < 0.01) return "Valor mínimo: R$ 0,01";
  if (value > 999999999.99) return "Valor máximo: R$ 999.999.999,99";
  if (!Number.isFinite(value)) return "Valor inválido";
  return null;
};
```

### Textos

```typescript
const validateText = (value: string, required: boolean = false): string | null => {
  if (required && !value.trim()) return "Campo obrigatório";
  if (value.length > 255) return "Máximo 255 caracteres";
  return null;
};
```

---

## 🚨 PROBLEMAS ATUAIS IDENTIFICADOS

### ❌ Input.tsx (Componente Base)

**Problema:**
```typescript
// Linha 10-15: Forçando UPPERCASE em TODOS os inputs
onInput={(e) => {
  const target = e.currentTarget;
  if (target.type === "text" || !target.type) {
    target.value = target.value.toUpperCase(); // ❌ ERRADO
  }
}}

// Linha 20: Classe CSS uppercase
className="uppercase" // ❌ ERRADO
```

**Impacto:**
- Todos os campos de texto ficam em MAIÚSCULAS
- Viola padrão de dados
- Prejudica UX

**Solução:**
- Remover transformação UPPERCASE do componente base
- Criar componentes especializados
- Aplicar UPPERCASE apenas onde necessário

---

## ✅ PLANO DE IMPLEMENTAÇÃO

### Fase 1: Componentes Base
1. ✅ Corrigir `Input.tsx` (remover UPPERCASE)
2. ✅ Criar `CurrencyInput.tsx`
3. ✅ Criar `TextInput.tsx`
4. ✅ Criar `CodeInput.tsx`

### Fase 2: Hooks e Utilitários
5. ✅ Criar `useCurrencyInput` hook
6. ✅ Criar funções de formatação
7. ✅ Criar funções de validação

### Fase 3: Migração
8. 🔄 Migrar formulários de transação
9. 🔄 Migrar formulários de conta
10. 🔄 Migrar formulários de categoria

### Fase 4: Testes
11. 🧪 Testar inputs de valor
12. 🧪 Testar inputs de texto
13. 🧪 Validar persistência

---

## 📋 CHECKLIST DE CONFORMIDADE

- [ ] Input base NÃO força UPPERCASE
- [ ] CurrencyInput formata valores corretamente
- [ ] TextInput preserva entrada do usuário
- [ ] CodeInput aplica UPPERCASE apenas onde necessário
- [ ] Backend recebe valores numéricos (não strings)
- [ ] Banco usa DECIMAL(15,2) para valores
- [ ] Textos salvos exatamente como digitados
- [ ] Validações implementadas
- [ ] Testes criados

---

## 🎯 RESULTADO ESPERADO

### Antes ❌
```
Descrição: COMPRA NO MERCADO
Valor: "1.234,56" (string)
Nome: CONTA CORRENTE
```

### Depois ✅
```
Descrição: Compra no mercado
Valor: 1234.56 (number)
Nome: Conta Corrente
```

---

> **Próxima Ação:** Implementar correções nos componentes
