const generateOrderNumber = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

    const randomNumber = Math.floor(10000 + Math.random() * 90000);

    const orderNumber = `KL${year}${month}${randomNumber}`;

    return orderNumber;
};

module.exports = { generateOrderNumber }