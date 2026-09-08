function showMsg(text, type) {
  document.getElementById('msgBox').innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}

async function loadDropdowns() {
  const [ingredients, suppliers] = await Promise.all([
    apiCall('getIngredients', {}),
    apiCall('getSuppliers', {})
  ]);
  document.getElementById('siIngredient').innerHTML = ingredients.map(i => `<option value="${i.ID}">${i.Name} (${i.Unit}) - Stock: ${i.Stock}</option>`).join('');
  document.getElementById('siSupplier').innerHTML = suppliers.map(s => `<option value="${s.ID}">${s.Name}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireLogin();
  if (!user) return;
  renderNav('stock-in', user);

  await loadDropdowns();

  const modal = document.getElementById('ingredientModal');
  document.getElementById('addIngredientBtn').addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('cancelIngredientBtn').addEventListener('click', () => modal.classList.remove('open'));

  document.getElementById('ingredientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('addIngredient', {
      name: document.getElementById('iName').value,
      unit: document.getElementById('iUnit').value,
      stock: document.getElementById('iStock').value,
      cost: document.getElementById('iCost').value,
      reorderLevel: document.getElementById('iReorder').value
    });
    if (res.error) { alert('Error: ' + res.error); return; }
    modal.classList.remove('open');
    document.getElementById('ingredientForm').reset();
    await loadDropdowns();
  });

  document.getElementById('stockInForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiCall('stockIn', {
      ingredientId: document.getElementById('siIngredient').value,
      supplierId: document.getElementById('siSupplier').value,
      quantity: document.getElementById('siQty').value,
      costPrice: document.getElementById('siCost').value,
      referenceNo: document.getElementById('siRef').value
    });
    if (res.error) { showMsg('Error: ' + res.error, 'error'); return; }
    showMsg('Stock in recorded successfully.', 'ok');
    document.getElementById('stockInForm').reset();
    await loadDropdowns();
  });
});
