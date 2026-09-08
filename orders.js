function showMsg(text, type) {
  document.getElementById('msgBox').innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}

let menuItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('orders', user);

  menuItems = await apiCall('getMenu', {});
  const available = menuItems.filter(m => m.Status === 'available');
  document.getElementById('oMenuItem').innerHTML = available.map(m => `<option value="${m.ID}" data-price="${m.Price}">${m.Name} (${m.Size}) - \u20B1${m.Price}</option>`).join('');

  document.getElementById('oMenuItem').addEventListener('change', (e) => {
    const price = e.target.selectedOptions[0].dataset.price;
    document.getElementById('oPrice').value = price;
  });
  // pre-fill price for first item
  if (available.length) document.getElementById('oPrice').value = available[0].Price;

  document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('placeOrder', {
      menuItemId: document.getElementById('oMenuItem').value,
      quantity: document.getElementById('oQty').value,
      sellingPrice: document.getElementById('oPrice').value,
      orderType: document.getElementById('oType').value,
      customerName: document.getElementById('oCustomer').value,
      referenceNo: document.getElementById('oRef').value
    });
    if (res.error) {
      const messages = { item_unavailable: 'That menu item is currently unavailable.' };
      showMsg('Error: ' + (messages[res.error] || res.error), 'error');
      return;
    }
    showMsg('Order saved successfully.', 'ok');
    document.getElementById('orderForm').reset();
    if (available.length) document.getElementById('oPrice').value = available[0].Price;
  });
});
