/**
 * Функция проверки аргумента как массив с элементами
 * @param value
 * @return {boolean}
 */
function isFilledArray(value) {
    return Array.isArray(value) && value.length > 0;
}

/**
 * Функция проверки типа аргумента как функция
 * @param value
 * @return {boolean}
 */
function isFunction(value) {
    return typeof value === 'function';
}

/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const {discount, sale_price, quantity} = purchase;

    const discountAsNumber = discount / 100;
    const amount = sale_price * quantity;

    return amount * (1 - discountAsNumber);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    }

    return seller.profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!data
        || !isFilledArray(data.customers)
        || !isFilledArray(data.sellers)
        || !isFilledArray(data.products)
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций

    const {calculateRevenue, calculateBonus} = options;

    if (!isFunction(calculateRevenue)) {
        throw new Error('calculateRevenue, ожидалась функция');
    }

    if (!isFunction(calculateBonus)) {
        throw new Error('calculateBonus, ожидалась функция');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map((seller) => {
        return {
            seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {},
        };
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((acc, seller) => {
        return {
            ...acc,
            [seller.seller_id]: seller,
        };
    }, {});

    const productIndex = data.products.reduce((acc, product) => {
        return {
            ...acc,
            [product.sku]: product,
        };
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach((record) => {
        const seller = sellerIndex[record.seller_id];

        // Увеличить количество продаж
        seller.sales_count += 1;

        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach((item) => {
            const product = productIndex[item.sku];

            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;

            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product);

            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;

            // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
        return b.profit - a.profit;
    });

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        console.log(seller);
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        console.log(productIndex);
        seller.top_products = Object.entries(seller.products_sold).
            map(([sku, quantity]) => {
                return {
                    sku,
                    quantity,
                };
            }).
            sort((a, b) => {
                return b.quantity - a.quantity;
            }).
            slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map((seller) => {
        return {
            ...seller,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            bonus: +seller.bonus.toFixed(2),
        };
    });
}
