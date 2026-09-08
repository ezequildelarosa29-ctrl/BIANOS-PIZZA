"use strict";
function showMsg(text,type="error") { const box=document.getElementById("msgBox"); if(box) box.innerHTML=`<div class="msg msg-${type}">${text}</div>`; }
async function loadDropdowns() {
  const ing = await apiCall("getIngredients", {});
  const sup = await apiCall("getSuppliers", {});
  if (ing?.error) throw new Error(ing.error);
  if (sup?.error) throw new Error(sup.error);
  const ingredientList = Array.isArray(ing) ? ing : [];
  const supplierList = Array.isArray(sup) ? sup : [];
  const iSel=document.getElementById("siIngredient"), sSel=document.getElementById("siSupplier");
  if(iSel) iSel.innerHTML=ingredientList.map(i=>`<option value="${i.ID}">${i.Name} (${i.Unit}) - Stock: ${i.Stock}</option>`).join("");
  if(sSel) sSel.innerHTML=supplierList.map(s=>`<option value="${s.ID}">${s.Name}</option>`).join("");
}

document.addEventListener("DOMContentLoaded", async()=>{
  const user=requireLogin(); if(!user)return; renderNav("stock-in",user);
  const modal=document.getElementById("ingredientModal"), add=document.getElementById("addIngredientBtn"), cancel=document.getElementById("cancelIngredientBtn"), form=document.getElementById("ingredientForm"), stockForm=document.getElementById("stockInForm");
  // Bind UI FIRST so modal always opens even if API loading fails.
  if(add&&modal)add.addEventListener("click",()=>modal.classList.add("open"));
  if(cancel&&modal)cancel.addEventListener("click",()=>modal.classList.remove("open"));
  if(modal)modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
  if(form)form.addEventListener("submit",async e=>{e.preventDefault();try{const r=await apiCall("addIngredient",{name:iName.value.trim(),unit:iUnit.value.trim(),stock:iStock.value,cost:iCost.value,reorderLevel:iReorder.value});if(r.error){showMsg("Error: "+r.error);return;}modal?.classList.remove("open");form.reset();await loadDropdowns();showMsg("Ingredient added successfully.","ok");}catch(err){showMsg(err.message)}});
  if(stockForm)stockForm.addEventListener("submit",async e=>{e.preventDefault();try{const r=await apiCall("stockIn",{ingredientId:siIngredient.value,supplierId:siSupplier.value,quantity:siQty.value,costPrice:siCost.value,referenceNo:siRef.value.trim()});if(r.error){showMsg("Error: "+r.error);return;}showMsg("Stock in recorded successfully.","ok");stockForm.reset();await loadDropdowns();}catch(err){showMsg(err.message)}});
  try{await loadDropdowns();}catch(err){showMsg("Could not load ingredients/suppliers: "+err.message);}
});
