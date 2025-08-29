/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountCalc = 1 - (purchase.discount / 100);
    return revenue = sale_price * quantity * discountCalc;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if ((index === 1) || (index === 2)) {
        return profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    } else { // Для всех остальных
        return profit * 0.05;
    }
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
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.customers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (!typeof calculateRevenue === "function" || !typeof calculateBonus === "function") {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = new Map(data.sellers.map(seller => ([seller.id, {
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }])));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(data.sellers.map(seller => [seller.id, sellerStats.get(seller.id)]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж
        seller.sales_count += 1;
        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            let cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            let revenue = calculateRevenue(item, product);                                           // --------проверить совместимость опции
            // Посчитать прибыль: выручка минус себестоимость
            let profit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Преобразование Map в массив
    let sellerStatsMass = Array.from(sellerStats);

    // @TODO: Сортировка продавцов по прибыли
    // Сортируем продавцов по прибыли
    sellerStatsMass.sort((a, b) => b[1].profit - a[1].profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStatsMass.forEach((seller, index) => {
        let total = sellerStatsMass.length;
        seller[1].bonus = calculateBonus(index, total, seller[1]);
        seller[1].top_products = Object.entries(seller[1].products_sold);
        seller[1].top_products.sort((a, b) => b[1] - a[1]);
        seller[1].top_products = seller[1].top_products.slice(0, 10).map(([sku, quantity]) => ({sku, quantity}));
    });


    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStatsMass.map(seller => ({
        seller_id: seller[1].id,
        name: seller[1].name,
        revenue: +seller[1].revenue.toFixed(2),
        profit: +seller[1].profit.toFixed(2),
        sales_count: seller[1].sales_count,
        top_products: seller[1].top_products,
        bonus: +seller[1].bonus.toFixed(2)
    }));

}
