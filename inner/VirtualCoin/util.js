function formatPrice(price){
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatRelativeRate(rate){
    return `${rate > 0 ? "+" : ""}${rate.toFixed(2)}%`;
}