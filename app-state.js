const APP_STORAGE_KEYS = {
    transactions: 'credit-union-transactions-v2',
    balance: 'credit-union-balance-v2'
};

const DEFAULT_BALANCE = '$1,090,000.00';
const DEFAULT_BALANCE_NUMERIC = 1090000;

const DEFAULT_TRANSACTIONS = [
    {
        id: 'seed-wire-transfer',
        date: '2026-04-12',
        displayDate: 'Apr 12, 2026',
        title: 'Wire Transfer Received',
        subtitle: 'Business Capital Investment',
        details: 'Business Capital Investment Reference #X902L',
        amount: '+$2,500,000.00',
        balanceAfter: '$1,090,000.00',
        direction: 'credit',
        status: 'completed'
    },
    {
        id: 'seed-real-estate',
        date: '2026-04-09',
        displayDate: 'Apr 09, 2026',
        title: 'Real Estate Holding LLC',
        subtitle: 'Property Escrow Payment',
        details: 'Property Escrow Payment - Automated Draft',
        amount: '-$450,000.00',
        balanceAfter: '$14,500,000.00',
        direction: 'debit',
        status: 'completed'
    },
    {
        id: 'seed-dividend',
        date: '2026-03-18',
        displayDate: 'Mar 18, 2026',
        title: 'Dividend Deposit',
        subtitle: 'Global Equities Portfolio',
        details: 'Global Equities Portfolio Yield',
        amount: '+$124,500.00',
        balanceAfter: '$14,950,000.00',
        direction: 'credit',
        status: 'completed'
    },
    {
        id: 'seed-management-fee',
        date: '2026-02-28',
        displayDate: 'Feb 28, 2026',
        title: 'Stock Growers Asset Management Fee',
        subtitle: 'Monthly Advisory Service Charge',
        details: 'Monthly Advisory Service Charge',
        amount: '-$5,000.00',
        balanceAfter: '$14,825,500.00',
        direction: 'debit',
        status: 'completed'
    },
    {
        id: 'seed-interest-payment',
        date: '2026-01-15',
        displayDate: 'Jan 15, 2026',
        title: 'Interest Payment Received',
        subtitle: 'Tier 1 Elite Savings Yield',
        details: 'Tier 1 Elite Savings Yield',
        amount: '+$14,230.15',
        balanceAfter: '$14,830,500.00',
        direction: 'credit',
        status: 'completed'
    }
];

function cloneDefaultTransactions() {
    return DEFAULT_TRANSACTIONS.map((transaction) => ({ ...transaction }));
}

function sortTransactions(transactions) {
    return [...transactions].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeB - timeA;
    });
}

function loadTransactions() {
    try {
        const stored = localStorage.getItem(APP_STORAGE_KEYS.transactions);
        if (!stored) {
            const seeded = cloneDefaultTransactions();
            saveTransactions(seeded);
            return seeded;
        }

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid transaction store');
        }

        return sortTransactions(parsed);
    } catch (error) {
        const seeded = cloneDefaultTransactions();
        saveTransactions(seeded);
        return seeded;
    }
}

function saveTransactions(transactions) {
    localStorage.setItem(
        APP_STORAGE_KEYS.transactions,
        JSON.stringify(sortTransactions(transactions))
    );
}

function formatCurrencyInput(amountValue) {
    const numericAmount = Number(amountValue);
    return formatCurrencyValue(numericAmount);
}

function formatCurrencyValue(amountValue) {
    const numericAmount = Number(amountValue);
    if (!Number.isFinite(numericAmount)) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(numericAmount);
}

function parseCurrencyValue(amountValue) {
    if (typeof amountValue === 'number') {
        return amountValue;
    }

    const cleaned = String(amountValue).replace(/[^0-9.-]/g, '');
    const numericAmount = Number(cleaned);
    return Number.isFinite(numericAmount) ? numericAmount : 0;
}

function loadCurrentBalance() {
    try {
        const stored = localStorage.getItem(APP_STORAGE_KEYS.balance);
        if (!stored) {
            saveCurrentBalance(DEFAULT_BALANCE_NUMERIC);
            return DEFAULT_BALANCE_NUMERIC;
        }

        const parsed = Number(stored);
        if (!Number.isFinite(parsed)) {
            throw new Error('Invalid balance store');
        }

        return parsed;
    } catch (error) {
        saveCurrentBalance(DEFAULT_BALANCE_NUMERIC);
        return DEFAULT_BALANCE_NUMERIC;
    }
}

function saveCurrentBalance(balanceValue) {
    localStorage.setItem(APP_STORAGE_KEYS.balance, String(balanceValue));
}

function renderBalanceText(elementId, options) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentBalance = formatCurrencyValue(loadCurrentBalance());
    if (options && options.attributeName) {
        element.setAttribute(options.attributeName, currentBalance);
    }
    element.textContent = currentBalance;
}

function renderTransferAccountOption(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentBalance = formatCurrencyValue(loadCurrentBalance());
    select.innerHTML = `<option>Premium Account (...4598) - ${escapeHtml(currentBalance)}</option>`;
}

function formatDisplayDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }).format(date);
}

function addPendingTransfer(transferInput) {
    const now = new Date();
    const transferAmount = Number(transferInput.amount);
    const amountText = formatCurrencyValue(transferAmount);
    const recipient = transferInput.recipient || 'External Recipient';
    const memo = transferInput.memo || 'Transfer created online';
    const transactions = loadTransactions();
    const currentBalance = loadCurrentBalance();
    const updatedBalance = currentBalance - transferAmount;

    const pendingTransaction = {
        id: `pending-transfer-${now.getTime()}`,
        date: now.toISOString(),
        displayDate: formatDisplayDate(now),
        title: `Transfer to ${recipient}`,
        subtitle: 'Pending approval',
        details: memo,
        amount: `-${amountText}`,
        balanceAfter: formatCurrencyValue(updatedBalance),
        direction: 'debit',
        status: 'pending'
    };

    transactions.unshift(pendingTransaction);
    saveTransactions(transactions);
    saveCurrentBalance(updatedBalance);
    return pendingTransaction;
}

function renderRecentTransactions(containerId, limit) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const transactions = loadTransactions().slice(0, limit);
    container.innerHTML = transactions.map(createRecentTransactionMarkup).join('');
    if (window.lucide) window.lucide.createIcons();
}

function renderTransactionsTable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const transactions = loadTransactions();
    container.innerHTML = transactions.map(createTableTransactionMarkup).join('');
    if (window.lucide) window.lucide.createIcons();
}

function createRecentTransactionMarkup(transaction) {
    const isCredit = transaction.direction === 'credit';
    const iconName = isCredit ? 'arrow-down-left' : 'arrow-up-right';
    const iconWrapperClass = isCredit
        ? 'bg-green-100 text-green-600'
        : 'bg-blue-100 text-blue-600';
    const amountClass = isCredit
        ? 'text-sm font-bold text-green-600'
        : 'text-sm font-semibold text-gray-900';
    const pendingBadge = transaction.status === 'pending'
        ? '<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Pending</span>'
        : '';

    return `
        <div class="p-6 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer">
            <div class="flex items-center space-x-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${iconWrapperClass}">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold text-gray-900">${escapeHtml(transaction.title)}</p>
                        ${pendingBadge}
                    </div>
                    <p class="text-xs text-gray-500">${escapeHtml(transaction.subtitle)}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="${amountClass}">${escapeHtml(transaction.amount)}</p>
                <p class="text-xs text-gray-500">${escapeHtml(transaction.displayDate)}</p>
            </div>
        </div>
    `;
}

function createTableTransactionMarkup(transaction) {
    const isCredit = transaction.direction === 'credit';
    const amountClass = isCredit
        ? 'text-right font-bold text-green-600 whitespace-nowrap'
        : 'text-right font-medium text-gray-900 whitespace-nowrap';
    const pendingBadge = transaction.status === 'pending'
        ? '<span class="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Pending</span>'
        : '';

    return `
        <tr class="hover:bg-gray-50 transition cursor-pointer">
            <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${escapeHtml(transaction.displayDate)}</td>
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">
                    ${escapeHtml(transaction.title)}
                    ${pendingBadge}
                </div>
                <div class="text-xs text-gray-500">${escapeHtml(transaction.details)}</div>
            </td>
            <td class="px-6 py-4 ${amountClass}">${escapeHtml(transaction.amount)}</td>
            <td class="px-6 py-4 text-right text-gray-500 whitespace-nowrap">${escapeHtml(transaction.balanceAfter)}</td>
        </tr>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
