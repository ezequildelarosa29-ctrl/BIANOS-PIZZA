/**
 * BIANO'S PIZZA - ORDERING & INVENTORY SYSTEM
 * Backend: Google Apps Script + Google Sheets (database)
 *
 * SETUP:
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script. Paste this file as Code.gs, and appsscript.json as the manifest.
 * 3. Run the `setup` function once (Run > setup) to create all sheets + the first admin user.
 * 4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 5. Copy the Web App URL into frontend/js/api.js (API_URL).
 *
 * All requests are POST with Content-Type: text/plain (NOT application/json).
 * This avoids CORS preflight (OPTIONS) requests, which Apps Script Web Apps cannot handle.
 * Body is a JSON string: { "action": "...", "token": "...", ...otherFields }
 */

// ---------- CONFIG ----------
const SESSION_HOURS = 8;
const OTP_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const SHEETS = {
  USERS: 'Users',
  MENU: 'MenuItems',
  INGREDIENTS: 'Ingredients',
  SUPPLIERS: 'Suppliers',
  STOCK_IN: 'StockIn',
  ORDERS: 'Orders',
  ACTIVITY: 'ActivityLog'
};

// ---------- ENTRY POINT ----------
function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const handlers = {
      getCaptcha: () => getCaptcha(),
      login: () => login(body),
      verifyOtp: () => verifyOtp(body),
      resendOtp: () => resendOtp(body),
      logout: () => logout(body),

      getDashboard: () => withAuth(body, getDashboard),

      getMenu: () => withAuth(body, getMenu),
      addMenuItem: () => withAuth(body, (u) => addMenuItem(u, body)),
      updateMenuItem: () => withAuth(body, (u) => updateMenuItem(u, body)),

      getIngredients: () => withAuth(body, getIngredients),
      addIngredient: () => withAuth(body, (u) => addIngredient(u, body)),

      getSuppliers: () => withAuth(body, getSuppliers),
      addSupplier: () => withAuth(body, (u) => addSupplier(u, body)),

      stockIn: () => withAuth(body, (u) => stockIn(u, body)),
      placeOrder: () => withAuth(body, (u) => placeOrder(u, body)),

      getReports: () => withAuth(body, getReports),

      getUsers: () => withAuth(body, (u) => { requireAdmin(u); return getUsers(); }),
      addUser: () => withAuth(body, (u) => { requireAdmin(u); return addUser(u, body); }),
      updateUser: () => withAuth(body, (u) => { requireAdmin(u); return updateUser(u, body); })
    };

    if (!handlers[action]) throw new Error('unknown_action');
    result = handlers[action]();
  } catch (err) {
    result = { error: err.message || 'server_error' };
  }
  return jsonResponse(result);
}

function doGet(e) {
  return jsonResponse({ status: "Biano's Pizza API is running. Use POST requests." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- SETUP (run once manually) ----------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheetIfMissing(ss, SHEETS.USERS,
    ['ID', 'Username', 'PasswordHash', 'Salt', 'Role', 'Email', 'Status',
     'FailedAttempts', 'LockUntil', 'OTPCode', 'OTPExpiry', 'SessionToken', 'SessionExpiry', 'CreatedAt']);

  createSheetIfMissing(ss, SHEETS.MENU,
    ['ID', 'Name', 'Category', 'Size', 'Price', 'Cost', 'Status', 'CreatedAt']);

  createSheetIfMissing(ss, SHEETS.INGREDIENTS,
    ['ID', 'Name', 'Unit', 'Stock', 'Cost', 'ReorderLevel', 'Status', 'CreatedAt']);

  createSheetIfMissing(ss, SHEETS.SUPPLIERS,
    ['ID', 'Name', 'Contact', 'Phone', 'Email', 'Status', 'CreatedAt']);

  createSheetIfMissing(ss, SHEETS.STOCK_IN,
    ['ID', 'Date', 'IngredientID', 'SupplierID', 'Quantity', 'CostPrice', 'ReferenceNo', 'UserID']);

  createSheetIfMissing(ss, SHEETS.ORDERS,
    ['ID', 'Date', 'MenuItemID', 'Quantity', 'SellingPrice', 'CustomerName', 'OrderType', 'ReferenceNo', 'UserID']);

  createSheetIfMissing(ss, SHEETS.ACTIVITY,
    ['ID', 'Date', 'UserID', 'Username', 'Action', 'Description']);

  // Create first admin account if Users sheet is empty
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet.getLastRow() < 2) {
    // Fixed salt so this matches the pre-filled admin row in the spreadsheet template exactly.
    const salt = 'BIANOS-DEFAULT-SALT-0001';
    const hash = hashPassword('Admin123!', salt);
    usersSheet.appendRow(['U001', 'admin', hash, salt, 'admin', 'youremail@example.com',
      'active', 0, '', '', '', '', '', new Date()]);
    Logger.log('Default admin created -> username: admin | password: Admin123!  (CHANGE THIS AFTER FIRST LOGIN)');
    Logger.log('IMPORTANT: set the Email column to a real inbox you can access, for OTP codes.');
  }
}

function createSheetIfMissing(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}

// ---------- HELPERS ----------
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = values[i][idx]);
    obj._row = i + 1; // actual sheet row number, for updates
    rows.push(obj);
  }
  return rows;
}

function generateId(prefix, sheet) {
  const lastRow = sheet.getLastRow();
  return prefix + String(lastRow).padStart(4, '0') + Math.floor(Math.random() * 90 + 10);
}

function hashPassword(password, salt) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  return Utilities.getUuid() + Utilities.getUuid();
}

function logActivity(user, action, description) {
  const sheet = getSheet(SHEETS.ACTIVITY);
  sheet.appendRow([generateId('A', sheet), new Date(), user.ID, user.Username, action, description]);
}

// ---------- AUTH ----------
function getCaptcha() {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  const captchaId = Utilities.getUuid();
  CacheService.getScriptCache().put('captcha_' + captchaId, String(a + b), 300); // 5 min
  return { captchaId: captchaId, question: `${a} + ${b} = ?` };
}

function checkCaptcha(captchaId, answer) {
  const cache = CacheService.getScriptCache();
  const key = 'captcha_' + captchaId;
  const correct = cache.get(key);
  cache.remove(key);
  if (!correct || String(answer).trim() !== correct) {
    throw new Error('invalid_captcha');
  }
}

function login(body) {
  checkCaptcha(body.captchaId, body.captchaAnswer);

  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  const user = users.find(u => u.Username === body.username);
  if (!user) throw new Error('invalid_credentials');

  if (user.LockUntil && new Date(user.LockUntil) > new Date()) {
    throw new Error('account_locked');
  }
  if (user.Status !== 'active') throw new Error('account_inactive');

  const hash = hashPassword(body.password, user.Salt);
  if (hash !== user.PasswordHash) {
    const attempts = (user.FailedAttempts || 0) + 1;
    const updates = { FailedAttempts: attempts };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      updates.LockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
      updates.FailedAttempts = 0;
    }
    updateRow(sheet, user._row, updates);
    throw new Error('invalid_credentials');
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  updateRow(sheet, user._row, {
    OTPCode: otp,
    OTPExpiry: new Date(Date.now() + OTP_MINUTES * 60000),
    FailedAttempts: 0,
    LockUntil: ''
  });

  try {
    MailApp.sendEmail(user.Email, "Biano's Pizza - Your Login Verification Code",
      `Your verification code is: ${otp}\nIt expires in ${OTP_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.`);
  } catch (mailErr) {}

  return { status: 'otp_required', userId: user.ID };
}

function resendOtp(body) {
  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  const user = users.find(u => u.ID === body.userId);
  if (!user) throw new Error('invalid_user');

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  updateRow(sheet, user._row, { OTPCode: otp, OTPExpiry: new Date(Date.now() + OTP_MINUTES * 60000) });
  try {
    MailApp.sendEmail(user.Email, "Biano's Pizza - Your Login Verification Code (Resent)",
      `Your new verification code is: ${otp}\nIt expires in ${OTP_MINUTES} minutes.`);
  } catch (mailErr) {}

  return { status: 'otp_resent' };
}

function verifyOtp(body) {
  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  const user = users.find(u => u.ID === body.userId);
  if (!user) throw new Error('invalid_user');

  if (!user.OTPCode || user.OTPCode !== String(body.otp)) throw new Error('invalid_otp');
  if (!user.OTPExpiry || new Date(user.OTPExpiry) < new Date()) throw new Error('otp_expired');

  const token = generateToken();
  updateRow(sheet, user._row, {
    OTPCode: '',
    OTPExpiry: '',
    SessionToken: token,
    SessionExpiry: new Date(Date.now() + SESSION_HOURS * 3600000)
  });

  logActivity(user, 'LOGIN', 'User logged in');

  return { token: token, username: user.Username, role: user.Role };
}

function logout(body) {
  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  const user = users.find(u => u.SessionToken === body.token);
  if (user) {
    updateRow(sheet, user._row, { SessionToken: '', SessionExpiry: '' });
  }
  return { status: 'logged_out' };
}

function validateSession(token) {
  if (!token) return null;
  const users = sheetToObjects(getSheet(SHEETS.USERS));
  const user = users.find(u => u.SessionToken === token);
  if (!user) return null;
  if (!user.SessionExpiry || new Date(user.SessionExpiry) < new Date()) return null;
  return user;
}

function withAuth(body, fn) {
  const user = validateSession(body.token);
  if (!user) throw new Error('invalid_session');
  return fn(user);
}

function requireAdmin(user) {
  if (user.Role !== 'admin') throw new Error('forbidden_admin_only');
}

function updateRow(sheet, rowNum, updates) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowNum, col).setValue(updates[key]);
  });
}

// ---------- DASHBOARD ----------
function getDashboard(user) {
  const menu = sheetToObjects(getSheet(SHEETS.MENU));
  const ingredients = sheetToObjects(getSheet(SHEETS.INGREDIENTS));
  const stockIn = sheetToObjects(getSheet(SHEETS.STOCK_IN));
  const orders = sheetToObjects(getSheet(SHEETS.ORDERS));

  const totalMenuItems = menu.length;
  const totalIngredientStock = ingredients.reduce((s, i) => s + Number(i.Stock || 0), 0);
  const lowStock = ingredients.filter(i => Number(i.Stock || 0) <= Number(i.ReorderLevel || 0)).length;
  const totalSales = orders.reduce((s, r) => s + Number(r.Quantity || 0) * Number(r.SellingPrice || 0), 0);

  const recent = stockIn.map(r => ({ date: r.Date, type: 'Stock In', item: ingredientName(ingredients, r.IngredientID), qty: r.Quantity }))
    .concat(orders.map(r => ({ date: r.Date, type: 'Order', item: menuItemName(menu, r.MenuItemID), qty: r.Quantity })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  return { totalMenuItems, totalIngredientStock, lowStock, totalSales, recent };
}

function menuItemName(menu, id) {
  const m = menu.find(m => m.ID === id);
  return m ? m.Name : id;
}
function ingredientName(ingredients, id) {
  const i = ingredients.find(i => i.ID === id);
  return i ? i.Name : id;
}

// ---------- MENU ----------
function getMenu(user) {
  return sheetToObjects(getSheet(SHEETS.MENU));
}

function addMenuItem(user, body) {
  const sheet = getSheet(SHEETS.MENU);
  const id = generateId('M', sheet);
  sheet.appendRow([id, body.name, body.category, body.size, Number(body.price),
    Number(body.cost), 'available', new Date()]);
  logActivity(user, 'ADD_MENU_ITEM', `Added menu item ${body.name}`);
  return { status: 'ok', id: id };
}

function updateMenuItem(user, body) {
  const sheet = getSheet(SHEETS.MENU);
  const items = sheetToObjects(sheet);
  const m = items.find(m => m.ID === body.id);
  if (!m) throw new Error('menu_item_not_found');
  updateRow(sheet, m._row, body.updates);
  logActivity(user, 'UPDATE_MENU_ITEM', `Updated menu item ${body.id}`);
  return { status: 'ok' };
}

// ---------- INGREDIENTS ----------
function getIngredients(user) {
  return sheetToObjects(getSheet(SHEETS.INGREDIENTS));
}

function addIngredient(user, body) {
  const sheet = getSheet(SHEETS.INGREDIENTS);
  const id = generateId('I', sheet);
  sheet.appendRow([id, body.name, body.unit, Number(body.stock || 0), Number(body.cost || 0),
    Number(body.reorderLevel), 'active', new Date()]);
  logActivity(user, 'ADD_INGREDIENT', `Added ingredient ${body.name}`);
  return { status: 'ok', id: id };
}

// ---------- SUPPLIERS ----------
function getSuppliers(user) {
  return sheetToObjects(getSheet(SHEETS.SUPPLIERS));
}

function addSupplier(user, body) {
  const sheet = getSheet(SHEETS.SUPPLIERS);
  const id = generateId('S', sheet);
  sheet.appendRow([id, body.name, body.contact, body.phone, body.email, 'active', new Date()]);
  logActivity(user, 'ADD_SUPPLIER', `Added supplier ${body.name}`);
  return { status: 'ok', id: id };
}

// ---------- STOCK IN (ingredients) ----------
function stockIn(user, body) {
  const stockInSheet = getSheet(SHEETS.STOCK_IN);
  const id = generateId('SI', stockInSheet);
  stockInSheet.appendRow([id, new Date(), body.ingredientId, body.supplierId,
    Number(body.quantity), Number(body.costPrice), body.referenceNo, user.ID]);

  const ingredientsSheet = getSheet(SHEETS.INGREDIENTS);
  const ingredients = sheetToObjects(ingredientsSheet);
  const i = ingredients.find(i => i.ID === body.ingredientId);
  if (!i) throw new Error('ingredient_not_found');
  updateRow(ingredientsSheet, i._row, { Stock: Number(i.Stock || 0) + Number(body.quantity) });

  logActivity(user, 'STOCK_IN', `+${body.quantity} ${i.Unit} of ${i.Name}`);
  return { status: 'ok', id: id };
}

// ---------- ORDERS ----------
function placeOrder(user, body) {
  const menuSheet = getSheet(SHEETS.MENU);
  const menu = sheetToObjects(menuSheet);
  const m = menu.find(m => m.ID === body.menuItemId);
  if (!m) throw new Error('menu_item_not_found');
  if (m.Status !== 'available') throw new Error('item_unavailable');

  const ordersSheet = getSheet(SHEETS.ORDERS);
  const id = generateId('O', ordersSheet);
  ordersSheet.appendRow([id, new Date(), body.menuItemId, Number(body.quantity),
    Number(body.sellingPrice), body.customerName, body.orderType, body.referenceNo, user.ID]);

  logActivity(user, 'ORDER', `${body.quantity}x ${m.Name} (${body.orderType})`);
  return { status: 'ok', id: id };
}

// ---------- REPORTS ----------
function getReports(user) {
  const ingredients = sheetToObjects(getSheet(SHEETS.INGREDIENTS));
  const stockIn = sheetToObjects(getSheet(SHEETS.STOCK_IN));
  const orders = sheetToObjects(getSheet(SHEETS.ORDERS));
  const activity = sheetToObjects(getSheet(SHEETS.ACTIVITY));

  const inventoryValue = ingredients.reduce((s, i) => s + Number(i.Cost || 0) * Number(i.Stock || 0), 0);
  const totalSales = orders.reduce((s, r) => s + Number(r.Quantity || 0) * Number(r.SellingPrice || 0), 0);
  const totalStockIn = stockIn.reduce((s, r) => s + Number(r.Quantity || 0), 0);
  const totalOrders = orders.reduce((s, r) => s + Number(r.Quantity || 0), 0);

  const lowStock = ingredients.filter(i => Number(i.Stock || 0) <= Number(i.ReorderLevel || 0))
    .map(i => ({ item: i.Name, stock: i.Stock, reorder: i.ReorderLevel, status: Number(i.Stock) === 0 ? 'Out of Stock' : 'Low Stock' }));

  const recentActivity = activity.sort((a, b) => new Date(b.Date) - new Date(a.Date)).slice(0, 15)
    .map(a => ({ date: a.Date, user: a.Username, action: a.Action, description: a.Description }));

  return { inventoryValue, totalSales, totalStockIn, totalOrders, lowStock, recentActivity };
}

// ---------- USERS (admin only) ----------
function getUsers(user) {
  return sheetToObjects(getSheet(SHEETS.USERS)).map(u => ({
    ID: u.ID, Username: u.Username, Role: u.Role, Email: u.Email, Status: u.Status
  }));
}

function addUser(admin, body) {
  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  if (users.find(u => u.Username === body.username)) throw new Error('username_taken');

  const id = generateId('U', sheet);
  const salt = Utilities.getUuid();
  const hash = hashPassword(body.password, salt);
  sheet.appendRow([id, body.username, hash, salt, body.role, body.email,
    'active', 0, '', '', '', '', '', new Date()]);
  logActivity(admin, 'ADD_USER', `Created user ${body.username}`);
  return { status: 'ok', id: id };
}

function updateUser(admin, body) {
  const sheet = getSheet(SHEETS.USERS);
  const users = sheetToObjects(sheet);
  const u = users.find(u => u.ID === body.id);
  if (!u) throw new Error('user_not_found');

  const updates = {};
  if (body.role) updates.Role = body.role;
  if (body.status) updates.Status = body.status;
  if (body.newPassword) {
    const salt = Utilities.getUuid();
    updates.Salt = salt;
    updates.PasswordHash = hashPassword(body.newPassword, salt);
  }
  updateRow(sheet, u._row, updates);
  logActivity(admin, 'UPDATE_USER', `Updated user ${body.id}`);
  return { status: 'ok' };
}
