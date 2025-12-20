
import { toTransactionFormData } from './form-data';
import { FinancialTransactionFormData } from '../components/financial-transaction-form';

// Mock simples para simular FormData se não estiver disponível no ambiente de teste (Node < 18)
// Mas Node 18+ tem FormData nativo. Vamos assumir Node recente.

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FALHA: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ SUCESSO: ${message}`);
    }
}

console.log('--- Iniciando Testes de toTransactionFormData ---');

// Caso 1: Receita Simples
const receita: FinancialTransactionFormData = {
    type: 'receita',
    amount: 100.50,
    description: 'Salário',
    date: '2023-10-01',
    accountId: 'acc_123',
    categoryId: 'cat_salary',
    subcategoryId: 'sub_salary',
    paymentMethodId: 'pm_pix',
    notes: 'Pagamento mensal'
};

const fdReceita = toTransactionFormData(receita);
assert(fdReceita.get('amount') === '100.5', 'Receita: Valor deve ser 100.5');
assert(fdReceita.get('description') === 'Salário', 'Receita: Descrição correta');
assert(fdReceita.get('accountId') === 'acc_123', 'Receita: AccountId presente');
assert(fdReceita.get('category_id') === 'cat_salary', 'Receita: Categoria presente (snake_case check)');

// Caso 2: Transferência
const transferencia: FinancialTransactionFormData = {
    type: 'transferencia',
    amount: 500,
    description: '', // Deve assumir default
    date: '2023-10-02',
    accountId: 'acc_source',
    targetAccountId: 'acc_target',
    paymentMethodId: 'pm_ted'
};

const fdTransf = toTransactionFormData(transferencia);
assert(fdTransf.get('description') === 'Transferência', 'Transferência: Descrição padrão assumida');
assert(fdTransf.get('sourceAccountId') === 'acc_source', 'Transferência: Origem correta');
assert(fdTransf.get('targetAccountId') === 'acc_target', 'Transferência: Destino correto');

// Caso 3: Despesa Cartão de Crédito (Parcelada)
const compraCartao: FinancialTransactionFormData = {
    type: 'compra', // Lógica especial
    amount: 1200,
    description: 'iPhone',
    date: '2023-10-03',
    selectedCardId: 'card_visa',
    installments: '12',
    categoryId: 'cat_eletronicos',
    subcategoryId: 'sub_celular'
};

const fdCartao = toTransactionFormData(compraCartao);
assert(fdCartao.get('card_id') === 'card_visa', 'Cartão: card_id correto (snake_case)');
assert(fdCartao.get('installments') === '12', 'Cartão: Parcelas corretas');
assert(fdCartao.get('category_id') === 'cat_eletronicos', 'Cartão: Categoria correta');
assert(!fdCartao.has('accountId'), 'Cartão: Não deve ter accountId');

// Caso 4: Compra Retroativa (Lógica Complexa)
const compraRetro: FinancialTransactionFormData = {
    type: 'compra',
    amount: 1000,
    description: 'Notebook Antigo',
    date: '2023-01-01',
    selectedCardId: 'card_master',
    installments: '10',
    isRetroactive: true,
    startInstallment: 5,
    endInstallment: 10
};

const fdRetro = toTransactionFormData(compraRetro);
assert(fdRetro.get('is_retroactive') === 'true', 'Retroativo: Flag presente');
assert(fdRetro.get('startingInstallment') === '5', 'Retroativo: Parcela inicial correta');
assert(fdRetro.get('end_installment') === '10', 'Retroativo: Parcela final correta');
// Valor da parcela: 1000 / (10 - 5 + 1) = 1000 / 6 = 166.666...
const valParcela = parseFloat(fdRetro.get('installmentValue') as string);
assert(Math.abs(valParcela - 166.666) < 0.01, 'Retroativo: Cálculo de valor de parcela correto');

console.log('--- Todos os testes passaram! ---');
