(() => {
  console.log("Buku Kas Digital berjalan...");
console.log("Supabase:", supabaseClient);
  const CATEGORIES = {
    expense: ["Makan","Transport","Belanja","Tagihan","Hiburan","Kesehatan","Lainnya"],
    income: ["Gaji","Bonus","Freelance","Lainnya"],
    saving: ["Tabungan"]
  };

  const state = {
    ...Storage.load(),
    loaded: true,
    tab: "ringkasan",
    laporanView: "mingguan",
    sheetOpen: false,
    goalSheetOpen: false,
    budgetSheetOpen: false,
    templateManageOpen: false,
    templateFormOpen: false,
    confirmDeleteId: null,
    form: { type:"expense", amount:"", category:CATEGORIES.expense[0], desc:"", date:todayStr(), editingId:null },
    goalForm: { name:"Dana Darurat", target:"5000000" },
    budgetForm: {},
    templateForm: { name:"", type:"expense", amount:"", category:CATEGORIES.expense[0], desc:"" }
  };

  function todayStr(){ return formatLocalDate(new Date()); }
  function formatLocalDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function fmtRupiah(n){ const sign=n<0?"-":""; return sign+"Rp"+Math.abs(Math.round(Number(n)||0)).toLocaleString("id-ID"); }
  function formatThousands(raw){ if(raw===undefined||raw===null||raw==="") return ""; const n=parseInt(String(raw).replace(/\D/g,""),10); return Number.isFinite(n)?n.toLocaleString("id-ID"):""; }
  function fmtDate(s){ const d=new Date(s+"T00:00:00"); const months=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]; return `${d.getDate()} ${months[d.getMonth()]}`; }
  function escapeHtml(s){ const div=document.createElement("div"); div.textContent=s??""; return div.innerHTML; }
  function persist(){ Storage.save({version:1,transactions:state.transactions,goal:state.goal,budgets:state.budgets,templates:state.templates}); }
  async function loadTransactionsFromSupabase() {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    console.error("User belum login:", userError);
    return;
  }

  const { data, error } = await supabaseClient
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil transaksi:", error);
    alert("Gagal mengambil data transaksi: " + error.message);
    return;
  }

  state.transactions = (data || []).map(t => ({
    id: String(t.id),
    type: t.type,
    amount: Number(t.amount) || 0,
    category: t.category || "Lainnya",
    desc: t.note || t.category || "",
    date: t.transaction_date
  }));

  state.loaded = true;
  render();
}
  async function logoutUser(){
  const confirmLogout = confirm("Yakin ingin keluar dari akun?");

  if(!confirmLogout) return;

  const { error } = await supabaseClient.auth.signOut();

  if(error){
    alert("Gagal keluar: " + error.message);
    return;
  }

  window.location.reload();
}
  function totals(){
    return state.transactions.reduce((a,t)=>{
      if(t.type==="income") a.income+=Number(t.amount)||0;
      if(t.type==="expense") a.expense+=Number(t.amount)||0;
      if(t.type==="saving") a.saving+=Number(t.amount)||0;
      return a;
    },{income:0,expense:0,saving:0,balance:0});
  }
  function categoryBreakdown(){
    const m={}; state.transactions.forEach(t=>{ if(t.type==="expense") m[t.category]=(m[t.category]||0)+Number(t.amount||0); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }
  function monthlyCategoryExpense(){
    const key=todayStr().slice(0,7), m={};
    state.transactions.forEach(t=>{if(t.type==="expense"&&t.date?.slice(0,7)===key)m[t.category]=(m[t.category]||0)+Number(t.amount||0);});
    return m;
  }
  function getMonday(s){ const d=new Date(s+"T00:00:00"), day=d.getDay(); d.setDate(d.getDate()+(day===0?-6:1-day)); return d; }
  function weeklyReport(){
    const weeks={};
    state.transactions.forEach(t=>{
      const monday=getMonday(t.date), key=formatLocalDate(monday);
      if(!weeks[key]){const sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);weeks[key]={monday,sunday,income:0,expense:0,saving:0,cats:{}};}
      const w=weeks[key];
      if(t.type==="income")w.income+=Number(t.amount)||0;
      else if(t.type==="expense"){w.expense+=Number(t.amount)||0;w.cats[t.category]=(w.cats[t.category]||0)+(Number(t.amount)||0);}
      else if(t.type==="saving")w.saving+=Number(t.amount)||0;
    });
    const current=formatLocalDate(getMonday(todayStr()));
    return Object.entries(weeks).sort((a,b)=>b[0].localeCompare(a[0])).map(([key,w])=>({...w,key,isCurrent:key===current,net:w.income-w.expense,topCat:Object.entries(w.cats).sort((a,b)=>b[1]-a[1])[0]}));
  }
  function monthlyReport(){
    const months={};
    state.transactions.forEach(t=>{
      const key=t.date?.slice(0,7); if(!key)return;
      if(!months[key])months[key]={income:0,expense:0,saving:0,cats:{}};
      const m=months[key];
      if(t.type==="income")m.income+=Number(t.amount)||0;
      else if(t.type==="expense"){m.expense+=Number(t.amount)||0;m.cats[t.category]=(m.cats[t.category]||0)+(Number(t.amount)||0);}
      else if(t.type==="saving")m.saving+=Number(t.amount)||0;
    });
    const current=todayStr().slice(0,7);
    return Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])).map(([key,m])=>({...m,key,isCurrent:key===current,net:m.income-m.expense,topCat:Object.entries(m.cats).sort((a,b)=>b[1]-a[1])[0]}));
  }
  function fmtMonthLabel(key){const [y,m]=key.split("-").map(Number);return ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][m-1]+" "+y;}
  function fmtDayMonth(d){return `${d.getDate()} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()]}`;}

  async function saveTransaction() {
  const amount = Number(state.form.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Jumlah harus lebih dari 0.");
    return;
  }

  if (!state.form.date) {
    alert("Tanggal wajib diisi.");
    return;
  }

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Sesi login tidak ditemukan. Silakan login kembali.");
    return;
  }

  const payload = {
    user_id: user.id,
    type: state.form.type,
    amount: amount,
    category: state.form.category,
    note: (state.form.desc || state.form.category).trim(),
    transaction_date: state.form.date
  };

  // EDIT TRANSAKSI
  if (state.form.editingId) {
    const { error } = await supabaseClient
      .from("transactions")
      .update(payload)
      .eq("id", state.form.editingId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Gagal update:", error);
      alert("Gagal mengubah transaksi: " + error.message);
      return;
    }
  }

  // TAMBAH TRANSAKSI
  else {
    const { error } = await supabaseClient
      .from("transactions")
      .insert(payload);

    if (error) {
      console.error("Gagal insert:", error);
      alert("Gagal menyimpan transaksi: " + error.message);
      return;
    }
  }

  closeAll();
  resetTransactionForm();

  await loadTransactionsFromSupabase();
}
  function resetTransactionForm(){state.form={type:"expense",amount:"",category:CATEGORIES.expense[0],desc:"",date:todayStr(),editingId:null};}
  function closeAll(){state.sheetOpen=state.goalSheetOpen=state.budgetSheetOpen=state.templateManageOpen=state.templateFormOpen=false;state.confirmDeleteId=null;}
  function openAdd(){resetTransactionForm();state.sheetOpen=true;render();}
  function openEdit(id){const t=state.transactions.find(x=>x.id===id);if(!t)return;state.form={type:t.type,amount:String(Math.round(t.amount)),category:t.category,desc:t.desc,date:t.date,editingId:t.id};state.sheetOpen=true;render();}
  async function deleteTransaction(id) {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Sesi login tidak ditemukan. Silakan login kembali.");
    return;
  }

  const { error } = await supabaseClient
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Gagal menghapus transaksi:", error);
    alert("Gagal menghapus transaksi: " + error.message);
    return;
  }

  state.confirmDeleteId = null;

  await loadTransactionsFromSupabase();
}
  function useTemplate(id){const t=state.templates.find(x=>x.id===id);if(!t)return;state.transactions.unshift({id:crypto.randomUUID?.()||Date.now().toString(),type:t.type,amount:t.amount,category:t.category,desc:t.desc||t.name,date:todayStr()});persist();render();}
  function deleteTemplate(id){state.templates=state.templates.filter(t=>t.id!==id);persist();render();}

  function render(){
    const root=document.getElementById("bk-app"), t=totals(); t.balance=t.income-t.expense;
    const cats=categoryBreakdown(), maxCat=cats[0]?.[1]||1, goalPct=state.goal.target>0?Math.min(100,t.saving/state.goal.target*100):0, monthExp=monthlyCategoryExpense();
    let html=`<div class="cover">
  <div class="cover-eyebrow">Buku Kas Digital</div>
  <div class="cover-title">Catatan Keuangan</div>
  <div class="cover-sub">${state.transactions.length} transaksi tercatat</div>

  <button class="logout-btn" id="logout-btn">
    KELUAR
  </button>
</div>
    <div class="tabs">
      ${["ringkasan","transaksi","target","laporan"].map(x=>`<button class="tab ${state.tab===x?"active":""}" data-tab="${x}">${x.toUpperCase()}</button>`).join("")}
    </div><div class="content">`;

    if(state.tab==="ringkasan"){
      html+=`<div class="balance-block"><div class="balance-label">Saldo di Tangan</div><div class="balance-value">${fmtRupiah(t.balance)}</div></div>
      <div class="stat-row">
        <div class="stat-card income">
          <div class="lbl">Pemasukan</div>
          <div class="val">${fmtRupiah(t.income)}</div>
        </div>

        <div class="stat-card expense">
          <div class="lbl">Pengeluaran</div>
          <div class="val">${fmtRupiah(t.expense)}</div>
        </div>
      </div>

      <div class="stat-card" style="margin-bottom:18px">
        <div class="lbl">Dana Darurat</div>
        <div class="val" style="color:var(--gold)">${fmtRupiah(t.saving)}</div>
      </div>`;  
      html+=cats.length?`<div class="section-title">Pengeluaran per Kategori</div>${cats.map(([n,a])=>`<div class="cat-row"><div class="cat-name">${escapeHtml(n)}</div><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${a/maxCat*100}%"></div></div><div class="cat-amt">${fmtRupiah(a)}</div></div>`).join("")}`:`<div class="empty-state">Belum ada pengeluaran tercatat.</div>`;
      html+=`<div class="section-title-row"><div class="section-title">Budget Bulanan</div><button class="edit-goal-btn" id="edit-budget">ATUR BUDGET</button></div>`;
      const entries=Object.entries(state.budgets).filter(([,v])=>Number(v)>0);
      html+=entries.length?`${entries.map(([cat,b])=>{const spent=monthExp[cat]||0,over=spent>b,p=Math.min(100,spent/b*100);return `<div class="budget-row"><div class="budget-head"><span>${escapeHtml(cat)}</span><span>${fmtRupiah(spent)} / ${fmtRupiah(b)}</span></div><div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${p}%;background:${over?"var(--ink-red)":"var(--cover)"}"></div></div></div>`}).join("")}`:`<div class="empty-state" style="padding:20px">Belum ada budget diatur.</div>`;
    } else if(state.tab==="transaksi"){
      html+=`<div class="template-row">${state.templates.map(x=>`<button class="tpl-chip" data-use="${x.id}">+ ${escapeHtml(x.name)}</button>`).join("")}<button class="tpl-manage" id="tpl-manage">⚙ Kelola Template</button></div>`;
      html+=state.transactions.length?`${state.transactions.map(x=>`<div class="tx-row" data-edit="${x.id}"><div class="tx-left"><div class="tx-desc">${escapeHtml(x.desc)}</div><div class="tx-meta">${fmtDate(x.date)} · ${escapeHtml(x.category)}</div></div><div class="tx-amt ${x.type}">${x.type==="income"?"+":"−"} ${fmtRupiah(x.amount)}</div><button class="tx-del" data-del="${x.id}" aria-label="Hapus">✕</button></div>`).join("")}`:`<div class="empty-state">Belum ada catatan.<br>Ketuk + untuk nambah transaksi pertama.</div>`;
    } else if(state.tab==="target"){
      html+=`<div class="goal-card"><div class="goal-name">${escapeHtml(state.goal.name)}</div><div class="goal-nums"><span>${fmtRupiah(t.saving)}</span><span>${fmtRupiah(state.goal.target)}</span></div><div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${goalPct}%"></div></div><div class="goal-pct">${goalPct.toFixed(0)}% tercapai</div></div><button class="edit-goal-btn" id="edit-goal">UBAH TARGET</button><div class="section-title">Riwayat Nabung</div>`;
      const savings=state.transactions.filter(x=>x.type==="saving");
      html+=savings.length?savings.map(x=>`<div class="tx-row" data-edit="${x.id}"><div class="tx-left"><div class="tx-desc">${escapeHtml(x.desc)}</div><div class="tx-meta">${fmtDate(x.date)}</div></div><div class="tx-amt saving">+ ${fmtRupiah(x.amount)}</div><button class="tx-del" data-del="${x.id}">✕</button></div>`).join(""):`<div class="empty-state">Belum ada setoran tabungan.<br>Ketuk + dan pilih "Nabung".</div>`;
    } else {
      html+=`<div class="seg-control"><button class="seg-btn ${state.laporanView==="mingguan"?"active":""}" data-seg="mingguan">MINGGUAN</button><button class="seg-btn ${state.laporanView==="bulanan"?"active":""}" data-seg="bulanan">BULANAN</button></div>`;
      if(state.laporanView==="mingguan"){const rows=weeklyReport();html+=rows.length?rows.map(w=>`<div class="week-card ${w.isCurrent?"current":""}"><div class="week-header"><div class="week-range">${fmtDayMonth(w.monday)} – ${fmtDayMonth(w.sunday)}</div>${w.isCurrent?'<div class="week-tag">Minggu Ini</div>':""}</div><div class="week-stats"><div class="week-stat income"><div class="lbl">Masuk</div><div class="val">${fmtRupiah(w.income)}</div></div><div class="week-stat expense"><div class="lbl">Keluar</div><div class="val">${fmtRupiah(w.expense)}</div></div><div class="week-stat"><div class="lbl">Saldo</div><div class="val">${fmtRupiah(w.net)}</div></div></div>${w.topCat?`<div class="week-top">Paling boros: <b>${escapeHtml(w.topCat[0])}</b> · ${fmtRupiah(w.topCat[1])}</div>`:""}</div>`).join(""):`<div class="empty-state">Belum ada data laporan.</div>`;}
      else {const rows=monthlyReport();html+=rows.length?rows.map(m=>{const max=Math.max(m.income,m.expense,1);return `<div class="week-card ${m.isCurrent?"current":""}"><div class="week-header"><div class="week-range">${fmtMonthLabel(m.key)}</div>${m.isCurrent?'<div class="week-tag">Bulan Ini</div>':""}</div><div class="month-bar-row"><span class="mb-lbl">Masuk</span><div class="mb-bg"><div class="mb-fill income" style="width:${m.income/max*100}%"></div></div><span class="mb-val">${fmtRupiah(m.income)}</span></div><div class="month-bar-row"><span class="mb-lbl">Keluar</span><div class="mb-bg"><div class="mb-fill expense" style="width:${m.expense/max*100}%"></div></div><span class="mb-val">${fmtRupiah(m.expense)}</span></div><div class="week-top">Bersih: <b>${fmtRupiah(m.net)}</b>${m.topCat?` · Paling boros: <b>${escapeHtml(m.topCat[0])}</b>`:""}</div></div>`}).join(""):`<div class="empty-state">Belum ada data laporan.</div>`;}
    }

    html+=`</div><button class="fab" id="fab">+</button>`;
    if(state.sheetOpen) html+=renderTransactionSheet();
    if(state.goalSheetOpen) html+=renderGoalSheet();
    if(state.budgetSheetOpen) html+=renderBudgetSheet();
    if(state.templateManageOpen) html+=renderTemplateManage();
    if(state.templateFormOpen) html+=renderTemplateForm();
    if(state.confirmDeleteId) html+=renderConfirmDelete();
    root.innerHTML=html; attachHandlers();
  }

  function renderTransactionSheet(){const f=state.form,cats=CATEGORIES[f.type];return `<div class="sheet-overlay" id="sheet-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>${f.editingId?"Ubah Catatan":"Tambah Catatan"}</h3><div class="type-toggle">${["expense","income","saving"].map(x=>`<button class="type-btn ${f.type===x?"sel-"+x:""}" data-type="${x}">${x==="expense"?"PENGELUARAN":x==="income"?"PEMASUKAN":"NABUNG"}</button>`).join("")}</div><label>Jumlah (Rp)</label><input id="amount" inputmode="numeric" value="${formatThousands(f.amount)}"><label>Kategori</label><select id="category">${cats.map(c=>`<option value="${escapeHtml(c)}" ${c===f.category?"selected":""}>${escapeHtml(c)}</option>`).join("")}</select><label>Keterangan (opsional)</label><input id="desc" maxlength="120" value="${escapeHtml(f.desc)}"><label>Tanggal</label><input id="date" type="date" value="${f.date}"><div class="sheet-actions"><button class="btn-cancel" id="cancel">Batal</button><button class="btn-save" id="save">Simpan</button></div></div></div>`;}
  function renderGoalSheet(){const g=state.goalForm;return `<div class="sheet-overlay" id="goal-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>Ubah Target Tabungan</h3><label>Nama Target</label><input id="goal-name" maxlength="80" value="${escapeHtml(g.name)}"><label>Jumlah Target (Rp)</label><input id="goal-target" inputmode="numeric" value="${formatThousands(g.target)}"><div class="sheet-actions"><button class="btn-cancel" id="goal-cancel">Batal</button><button class="btn-save" id="goal-save">Simpan</button></div></div></div>`;}
  function renderBudgetSheet(){return `<div class="sheet-overlay" id="budget-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>Atur Budget per Kategori</h3>${CATEGORIES.expense.map(c=>`<label>${c}</label><input id="budget-${c}" inputmode="numeric" value="${formatThousands(state.budgetForm[c]||"")}">`).join("")}<div class="sheet-actions"><button class="btn-cancel" id="budget-cancel">Batal</button><button class="btn-save" id="budget-save">Simpan</button></div></div></div>`;}
  function renderTemplateManage(){return `<div class="sheet-overlay" id="tpl-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>Kelola Template</h3>${state.templates.length?state.templates.map(t=>`<div class="tx-row" style="cursor:default"><div class="tx-left"><div class="tx-desc">${escapeHtml(t.name)}</div><div class="tx-meta">${t.type==="income"?"Pemasukan":t.type==="saving"?"Nabung":"Pengeluaran"} · ${fmtRupiah(t.amount)} · ${escapeHtml(t.category)}</div></div><button class="tx-del" data-del-tpl="${t.id}">✕</button></div>`).join(""):`<div class="empty-state">Belum ada template.</div>`}<button class="btn-save" id="tpl-add" style="width:100%;margin-top:14px">+ Tambah Template</button><button class="btn-cancel" id="tpl-close" style="width:100%;margin-top:8px">Tutup</button></div></div>`;}
  function renderTemplateForm(){const f=state.templateForm,cats=CATEGORIES[f.type];return `<div class="sheet-overlay" id="tpl-form-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>Tambah Template</h3><label>Nama Template</label><input id="tpl-name" maxlength="80" value="${escapeHtml(f.name)}"><div class="type-toggle">${["expense","income","saving"].map(x=>`<button class="type-btn ${f.type===x?"sel-"+x:""}" data-tpltype="${x}">${x==="expense"?"PENGELUARAN":x==="income"?"PEMASUKAN":"NABUNG"}</button>`).join("")}</div><label>Jumlah (Rp)</label><input id="tpl-amount" inputmode="numeric" value="${formatThousands(f.amount)}"><label>Kategori</label><select id="tpl-category">${cats.map(c=>`<option value="${escapeHtml(c)}" ${c===f.category?"selected":""}>${escapeHtml(c)}</option>`).join("")}</select><label>Keterangan</label><input id="tpl-desc" maxlength="120" value="${escapeHtml(f.desc)}"><div class="sheet-actions"><button class="btn-cancel" id="tpl-form-cancel">Batal</button><button class="btn-save" id="tpl-form-save">Simpan Template</button></div></div></div>`;}
  function renderConfirmDelete(){const t=state.transactions.find(x=>x.id===state.confirmDeleteId);if(!t)return"";return `<div class="sheet-overlay" id="confirm-overlay"><div class="sheet" onclick="event.stopPropagation()"><h3>Hapus catatan ini?</h3><p style="font-size:13px;color:var(--muted)"><b style="color:var(--ink)">${escapeHtml(t.desc)}</b> · ${fmtRupiah(t.amount)} · ${fmtDate(t.date)}</p><div class="sheet-actions"><button class="btn-cancel" id="confirm-cancel">Batal</button><button class="btn-save" id="confirm-yes" style="background:var(--ink-red)">Ya, Hapus</button></div></div></div>`;}

  function attachHandlers(){
    const root=document.getElementById("bk-app");
    document
  .getElementById("logout-btn")
  ?.addEventListener("click", logoutUser);
    root.querySelectorAll(".tab").forEach(el=>el.onclick=()=>{state.tab=el.dataset.tab;render();});
    root.querySelectorAll(".seg-btn").forEach(el=>el.onclick=()=>{state.laporanView=el.dataset.seg;render();});
    document.getElementById("fab")?.addEventListener("click",openAdd);
    root.querySelectorAll("[data-edit]").forEach(el=>el.onclick=e=>{if(!e.target.closest("[data-del]"))openEdit(el.dataset.edit);});
    root.querySelectorAll("[data-del]").forEach(el=>el.onclick=e=>{e.stopPropagation();state.confirmDeleteId=el.dataset.del;render();});
    document.getElementById("confirm-overlay")?.addEventListener("click",()=>{state.confirmDeleteId=null;render();});
    document.getElementById("confirm-cancel")?.addEventListener("click",()=>{state.confirmDeleteId=null;render();});
    document.getElementById("confirm-yes")?.addEventListener("click",()=>deleteTransaction(state.confirmDeleteId));
    document.getElementById("sheet-overlay")?.addEventListener("click",()=>{state.sheetOpen=false;render();});
    document.getElementById("cancel")?.addEventListener("click",()=>{state.sheetOpen=false;render();});
    root.querySelectorAll("[data-type]").forEach(el=>el.onclick=()=>{state.form.type=el.dataset.type;state.form.category=CATEGORIES[el.dataset.type][0];render();});
    const amount=document.getElementById("amount"); amount?.addEventListener("input",e=>{state.form.amount=e.target.value.replace(/\D/g,"");e.target.value=formatThousands(state.form.amount);});
    document.getElementById("category")?.addEventListener("change",e=>state.form.category=e.target.value);
    document.getElementById("desc")?.addEventListener("input",e=>state.form.desc=e.target.value);
    document.getElementById("date")?.addEventListener("input",e=>state.form.date=e.target.value);
    document.getElementById("save")?.addEventListener("click",saveTransaction);

    document.getElementById("edit-goal")?.addEventListener("click",()=>{state.goalForm={name:state.goal.name,target:String(state.goal.target)};state.goalSheetOpen=true;render();});
    document.getElementById("goal-overlay")?.addEventListener("click",()=>{state.goalSheetOpen=false;render();});
    document.getElementById("goal-cancel")?.addEventListener("click",()=>{state.goalSheetOpen=false;render();});
    document.getElementById("goal-name")?.addEventListener("input",e=>state.goalForm.name=e.target.value);
    document.getElementById("goal-target")?.addEventListener("input",e=>{state.goalForm.target=e.target.value.replace(/\D/g,"");e.target.value=formatThousands(state.goalForm.target);});
    document.getElementById("goal-save")?.addEventListener("click",()=>{const target=Number(state.goalForm.target);if(!target||target<=0){alert("Target harus lebih dari 0.");return;}state.goal={name:state.goalForm.name.trim()||"Target Tabungan",target};persist();state.goalSheetOpen=false;render();});

    document.getElementById("edit-budget")?.addEventListener("click",()=>{state.budgetForm={};CATEGORIES.expense.forEach(c=>state.budgetForm[c]=state.budgets[c]?String(state.budgets[c]):"");state.budgetSheetOpen=true;render();});
    document.getElementById("budget-overlay")?.addEventListener("click",()=>{state.budgetSheetOpen=false;render();});
    document.getElementById("budget-cancel")?.addEventListener("click",()=>{state.budgetSheetOpen=false;render();});
    CATEGORIES.expense.forEach(c=>document.getElementById(`budget-${c}`)?.addEventListener("input",e=>{state.budgetForm[c]=e.target.value.replace(/\D/g,"");e.target.value=formatThousands(state.budgetForm[c]);}));
    document.getElementById("budget-save")?.addEventListener("click",()=>{const b={};CATEGORIES.expense.forEach(c=>{const n=Number(state.budgetForm[c]);if(n>0)b[c]=n;});state.budgets=b;persist();state.budgetSheetOpen=false;render();});

    root.querySelectorAll("[data-use]").forEach(el=>el.onclick=()=>useTemplate(el.dataset.use));
    document.getElementById("tpl-manage")?.addEventListener("click",()=>{state.templateManageOpen=true;render();});
    document.getElementById("tpl-overlay")?.addEventListener("click",()=>{state.templateManageOpen=false;render();});
    document.getElementById("tpl-close")?.addEventListener("click",()=>{state.templateManageOpen=false;render();});
    root.querySelectorAll("[data-del-tpl]").forEach(el=>el.onclick=e=>{e.stopPropagation();deleteTemplate(el.dataset.delTpl);});
    document.getElementById("tpl-add")?.addEventListener("click",()=>{state.templateForm={name:"",type:"expense",amount:"",category:CATEGORIES.expense[0],desc:""};state.templateManageOpen=false;state.templateFormOpen=true;render();});
    document.getElementById("tpl-form-overlay")?.addEventListener("click",()=>{state.templateFormOpen=false;state.templateManageOpen=true;render();});
    document.getElementById("tpl-form-cancel")?.addEventListener("click",()=>{state.templateFormOpen=false;state.templateManageOpen=true;render();});
    root.querySelectorAll("[data-tpltype]").forEach(el=>el.onclick=()=>{state.templateForm.type=el.dataset.tpltype;state.templateForm.category=CATEGORIES[el.dataset.tpltype][0];render();});
    document.getElementById("tpl-name")?.addEventListener("input",e=>state.templateForm.name=e.target.value);
    document.getElementById("tpl-amount")?.addEventListener("input",e=>{state.templateForm.amount=e.target.value.replace(/\D/g,"");e.target.value=formatThousands(state.templateForm.amount);});
    document.getElementById("tpl-category")?.addEventListener("change",e=>state.templateForm.category=e.target.value);
    document.getElementById("tpl-desc")?.addEventListener("input",e=>state.templateForm.desc=e.target.value);
    document.getElementById("tpl-form-save")?.addEventListener("click",()=>{const n=Number(state.templateForm.amount);if(!state.templateForm.name.trim()||!n||n<=0){alert("Nama dan jumlah template wajib diisi.");return;}state.templates.push({id:crypto.randomUUID?.()||Date.now().toString(),name:state.templateForm.name.trim(),type:state.templateForm.type,amount:n,category:state.templateForm.category,desc:state.templateForm.desc.trim()});persist();state.templateFormOpen=false;state.templateManageOpen=true;render();});
  }

  loadTransactionsFromSupabase();
})();
