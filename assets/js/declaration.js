/* Square Country Traveller Declaration — local-only, accessible multi-step form.
 * No answers are transmitted. LocalStorage is used ONLY by the explicit Save draft button.
 */
(() => {
  'use strict';
  const form = document.querySelector('#traveller-form');
  if (!form) return;
  const STORAGE_KEY = 'sc-traveller-declaration-draft-v1';
  const panes = [...form.querySelectorAll('.step-pane')];
  const navButtons = [...document.querySelectorAll('[data-nav-step]')];
  const travelList = document.getElementById('travel-list');
  const status = document.getElementById('status-line');
  const errorBox = document.getElementById('form-error');
  const nextBtn = document.getElementById('next-step');
  const prevBtn = document.getElementById('prev-step');
  const finishBtn = document.getElementById('finish-form');
  const completeScreen = document.getElementById('complete-screen');
  const printSheet = document.getElementById('print-sheet');
  const progressFill = document.getElementById('progress-fill');
  const progressPct = document.getElementById('progress-pct');
  let current = 1;
  let maxVisited = 1;
  let rowId = 0;
  let complete = false;

  const customs = {
    c_purchases: 'Goods or gifts acquired overseas',
    c_alcohol: 'Alcohol, tobacco or vaping products',
    c_cash: 'Large amounts of cash or monetary instruments',
    c_commercial: 'Commercial, trade or work goods',
    c_medicines: 'Controlled or large quantities of medication',
    c_restricted: 'Potentially restricted or controlled goods',
    c_others: 'Goods carried on behalf of someone else',
    c_separate: 'Goods arriving separately'
  };
  const biosecurity = {
    b_food: 'Food and drinks',
    b_animal: 'Animal-origin products',
    b_live: 'Live animals, insects or biological specimens',
    b_plant: 'Plants, seeds or plant products',
    b_soil: 'Soil, mud or contaminated items',
    b_outdoor: 'Used outdoor equipment and footwear',
    b_fishing: 'Fishing, hunting or freshwater equipment',
    b_farm: 'Farm visits, livestock or agricultural work',
    b_wildlife: 'Wildlife contact or collections',
    b_other: 'Other possible biosecurity risks',
    b_cleaned: 'Equipment cleaned and dried'
  };
  const labels = {
    family_name: 'Family name', given_names: 'Given names', birth_date: 'Date of birth',
    birth_country: 'Country of birth', nationality: 'Nationality', usual_residence: 'Country of usual residence', occupation: 'Occupation', passport_country: 'Passport issued by',
    passport_number: 'Passport number', passport_expiry: 'Passport expiry',
    entry_status: 'Entry status', permission_type: 'Entry permission',
    travel_mode: 'Mode of arrival', arrival_date: 'Arrival date', arrival_port: 'Arrival airport or port',
    origin_country: 'Country last departed', departure_port: 'Overseas boarding airport / port', departure_date: 'International journey start date',
    flight_number: 'Flight number', airline: 'Airline', vessel_name: 'Vessel name', voyage_number: 'Voyage identifier',
    travel_purpose: 'Reason for travel', stay_duration: 'Intended length of stay',
    address_line: 'First address in Square Country', city: 'Town or city', postcode: 'Postcode',
    email: 'Email', phone: 'Phone', customs_details: 'Customs details',
    customs_value: 'Approximate value', customs_currency: 'Currency',
    food_types: 'Food categories', bio_details: 'Biosecurity item / activity details',
    bio_luggage: 'Where relevant items are packed', checked_bags: 'Checked bags',
    carry_on_bags: 'Cabin bags', travelling_with: 'Travelling with others',
    other_items: 'Other information to declare', additional_details: 'Additional information',
    signature_name: 'Name of signatory', signature_date: 'Date signed', guardian_name: 'Parent / guardian',
    confirm_all_bags: 'All baggage considered', confirm_truth: 'Accuracy declaration accepted'
  };
  const optionLabels = {
    citizen:'Square Country citizen', resident:'Permanent resident', visa:'Temporary visa or permit holder',
    visitor:'Visitor', other:'Other', air:'By air', sea:'By sea',
    'returning-home':'Returning home', holiday:'Holiday / visiting family', business:'Business / work', study:'Study',
    transit:'Transit', 'under-week':'Less than 1 week', '1-4-weeks':'1–4 weeks',
    '1-3-months':'1–3 months', '3-12-months':'3–12 months', 'over-year':'Over a year',
    'not-sure':'Not yet sure', na:'Not applicable', checked:'Checked baggage', cabin:'Cabin baggage', both:'Checked and cabin baggage',
    'on-person':'On my person', none:'Activity only / no goods',
    meat:'Meat or meat products', dairy:'Dairy products', fruit:'Fruit or vegetables', snacks:'Packaged snacks',
    honey:'Honey or bee products', herbs:'Herbs, seeds or spices'
  };
  const escaped = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prettify = v => {
    if (Array.isArray(v)) return v.map(prettify).join(', ') || 'None';
    if (v === true || v === 'yes') return 'Yes';
    if (v === false || v === 'no') return 'No';
    if (!v && v !== 0) return 'Not provided';
    return optionLabels[v] || String(v);
  };
  const setStatus = message => { status.textContent = message; };
  const setError = message => {
    errorBox.hidden = !message;
    errorBox.textContent = message || '';
  };

  function createVisit(visit = {}) {
    const id = ++rowId;
    const row = document.createElement('div');
    row.className = 'travel-row';
    row.dataset.row = String(id);
    row.innerHTML = `<div class="travel-meta"><span>Country or territory <span class="visit-ordinal"></span></span><button type="button" class="remove-visit" aria-label="Remove this travel location">Remove</button></div>
      <div class="field"><label for="visit-country-${id}">Country / territory <span class="required">*</span></label><input name="visit_country_${id}" data-travel="country" id="visit-country-${id}" type="text" placeholder="Country or territory" required autocomplete="off"></div>
      <div class="field"><label for="visit-from-${id}">From <span class="optional">(optional)</span></label><input name="visit_from_${id}" data-travel="from" id="visit-from-${id}" type="date"></div>
      <div class="field"><label for="visit-to-${id}">To <span class="optional">(optional)</span></label><input name="visit_to_${id}" data-travel="to" id="visit-to-${id}" type="date"></div>
      <label class="checkline travel-transit"><input type="checkbox" data-travel="transit" name="visit_transit_${id}" value="yes"><span>This was a transit-only stop (I did not stay in the country)</span></label>`;
    travelList.appendChild(row);
    row.querySelector('[data-travel=country]').value = visit.country || '';
    row.querySelector('[data-travel=from]').value = visit.from || '';
    row.querySelector('[data-travel=to]').value = visit.to || '';
    row.querySelector('[data-travel=transit]').checked = Boolean(visit.transit);
    row.querySelector('.remove-visit').addEventListener('click', () => {
      if (travelList.children.length === 1) {
        row.querySelectorAll('input').forEach(input => { if (input.type === 'checkbox') input.checked = false; else input.value = ''; });
        setStatus('At least one travel location is required. The remaining entry has been cleared.');
      } else row.remove();
      renumberVisits();
    });
    renumberVisits();
    return row;
  }
  function renumberVisits() {
    [...travelList.children].forEach((row, i) => {
      row.querySelector('.visit-ordinal').textContent = `${i + 1}`;
    });
  }
  function getData() {
    const fd = new FormData(form);
    const values = {};
    for (const [key, value] of fd.entries()) {
      if (key.startsWith('visit_')) continue;
      if (key === 'food_types') {
        if (!values.food_types) values.food_types = [];
        values.food_types.push(value);
      } else values[key] = value;
    }
    values.food_types ||= [];
    values.confirm_all_bags = form.elements.confirm_all_bags.checked;
    values.confirm_truth = form.elements.confirm_truth.checked;
    values.visits = [...travelList.querySelectorAll('.travel-row')].map(row => ({
      country: row.querySelector('[data-travel=country]').value.trim(),
      from: row.querySelector('[data-travel=from]').value,
      to: row.querySelector('[data-travel=to]').value,
      transit: row.querySelector('[data-travel=transit]').checked
    }));
    return values;
  }
  function applyData(values) {
    if (!values || typeof values !== 'object') throw new Error('The data file has an invalid format.');
    form.reset();
    [...form.querySelectorAll('[name]')].forEach(input => {
      if (input.name.startsWith('visit_')) return;
      const val = values[input.name];
      if (input.type === 'radio') input.checked = val === input.value;
      else if (input.type === 'checkbox') {
        input.checked = input.name === 'food_types' ? Array.isArray(values.food_types) && values.food_types.includes(input.value) : Boolean(val);
      } else if (val !== undefined && val !== null) input.value = String(val);
    });
    travelList.innerHTML = '';
    const visits = Array.isArray(values.visits) && values.visits.length ? values.visits.slice(0, 50) : [{}];
    visits.forEach(v => createVisit(v));
    updateConditionals();
    complete = false;
    completeScreen.classList.remove('active');
    form.hidden = false;
    setError('');
    maxVisited = 1;
    showStep(1);
  }
  function updateConditionals() {
    document.querySelectorAll('[data-show-if],[data-show-if-any]').forEach(panel => {
      let show = false;
      const exact = panel.dataset.showIf;
      const any = panel.dataset.showIfAny;
      if (exact) {
        const sep = exact.indexOf(':');
        const name = exact.slice(0, sep);
        const accepted = exact.slice(sep + 1).split(',');
        const inputs = form.querySelectorAll(`[name="${name}"]`);
        const chosen = [...inputs].find(i => (i.type === 'radio' ? i.checked : true));
        show = Boolean(chosen && accepted.includes(chosen.value));
      } else if (any) {
        show = any.split(',').some(name => [...form.querySelectorAll(`[name="${name}"]`)].some(i => i.type === 'radio' && i.checked && i.value === 'yes'));
      }
      panel.hidden = !show;
      panel.querySelectorAll('input,select,textarea').forEach(input => { input.disabled = !show; });
    });
  }
  function validateStep(step, showErrors = true) {
    const pane = panes[step - 1];
    const fields = [...pane.querySelectorAll('input,select,textarea')].filter(x => !x.disabled);
    for (const field of fields) {
      if (!field.checkValidity()) {
        if (showErrors) {
          setError('Please complete the required information in this section before continuing.');
          showStep(step);
          field.reportValidity();
        }
        return false;
      }
    }
    if (step === 1) {
      const birth = form.elements.birth_date.value;
      const expiry = form.elements.passport_expiry.value;
      const arrival = form.elements.arrival_date.value;
      const today = new Date().toISOString().slice(0,10);
      if (birth && birth > today) {
        if (showErrors) { showStep(step); setError('Date of birth cannot be in the future.'); form.elements.birth_date.focus(); }
        return false;
      }
      if (birth && expiry && expiry <= birth) {
        if (showErrors) { showStep(step); setError('Check the passport expiry date. It must be after the date of birth.'); form.elements.passport_expiry.focus(); }
        return false;
      }
      if (arrival && expiry && expiry < arrival) {
        if (showErrors) { showStep(step); setError('Your passport expires before your stated arrival date. Check the dates.'); form.elements.passport_expiry.focus(); }
        return false;
      }
    }
    if (step === 2) {
      const departed = form.elements.departure_date.value;
      const arrived = form.elements.arrival_date.value;
      if (departed && arrived && departed > arrived) {
        if (showErrors) { showStep(step); setError('Your international journey start date cannot be after your arrival date.'); form.elements.departure_date.focus(); }
        return false;
      }
      const arrival = form.elements.arrival_date.value;
      const birth = form.elements.birth_date.value;
      const expiry = form.elements.passport_expiry.value;
      if (arrival && birth && arrival < birth) {
        if (showErrors) { showStep(step); setError('Your stated arrival date is before your date of birth.'); form.elements.arrival_date.focus(); }
        return false;
      }
      if (arrival && expiry && arrival > expiry) {
        if (showErrors) { showStep(step); setError('The passport expires before your stated arrival date.'); form.elements.arrival_date.focus(); }
        return false;
      }
    }
    if (step === 3) {
      const arrival = form.elements.arrival_date.value;
      for (const row of [...travelList.children]) {
        const from = row.querySelector('[data-travel=from]').value;
        const to = row.querySelector('[data-travel=to]').value;
        if ((from && to && from > to) || (arrival && (from > arrival || to > arrival))) {
          if (showErrors) {
            showStep(step);
            setError('Check your travel history dates. The start must be on or before the end, and travel should not be after arrival.');
            row.querySelector('[data-travel=from]').focus();
          }
          return false;
        }
      }
    }
    setError('');
    return true;
  }
  function showStep(step, scroll = true) {
    current = step;
    panes.forEach((pane, index) => pane.classList.toggle('active', index + 1 === step));
    navButtons.forEach((btn, index) => {
      const number = index + 1;
      btn.classList.toggle('active', number === step);
      btn.classList.toggle('passed', number < step);
      btn.disabled = number > maxVisited;
      btn.setAttribute('aria-current', number === step ? 'step' : 'false');
    });
    progressFill.style.width = `${Math.round(step / 7 * 100)}%`;
    progressPct.textContent = `${Math.round(step / 7 * 100)}%`;
    prevBtn.hidden = step === 1;
    nextBtn.hidden = step === 7;
    finishBtn.hidden = step !== 7;
    if (step === 7) renderReview();
    if (scroll) document.querySelector('.form-page-card').scrollIntoView({behavior: 'auto', block: 'start'});
  }
  function next() {
    if (!validateStep(current)) return;
    if (current >= 7) return;
    maxVisited = Math.max(maxVisited, current + 1);
    showStep(current + 1);
  }
  function reviewCard(title, rows, editStep) {
    const body = rows.filter(row => row && row[0]).map(([label, value, full]) =>
      `<div class="review-item${full ? ' full' : ''}"><dt>${escaped(label)}</dt><dd>${escaped(prettify(value))}</dd></div>`).join('');
    return `<section class="review-category"><div class="review-title"><strong>${escaped(title)}</strong><button type="button" class="edit-link" data-edit-step="${editStep}">Edit</button></div><dl class="review-rows">${body}</dl></section>`;
  }
  function renderReview() {
    const d = getData();
    const personal = ['family_name','given_names','birth_date','birth_country','nationality','usual_residence','occupation','passport_country','passport_number','passport_expiry','entry_status','permission_type'].filter(k => k !== 'permission_type' || d.permission_type).map(k => [labels[k], d[k]]);
    const journey = ['travel_mode','arrival_date','arrival_port','origin_country','departure_port','departure_date', ...(d.travel_mode === 'sea' ? ['vessel_name','voyage_number']:['flight_number','airline']), 'travel_purpose','stay_duration','address_line','city','postcode','email','phone'].map(k => [labels[k], d[k], k === 'address_line']);
    const travels = d.visits.map((v,i) => [`${i+1}. ${v.country || 'Country not provided'}`, `${v.from || 'Dates not given'}${v.to ? ' to '+v.to : ''}${v.transit ? ' · Transit only' : ''}`]);
    const customsRows = Object.entries(customs).map(([k,label]) => [label, d[k]]).concat(d.customs_details ? [['Goods described', d.customs_details, true]] : [], d.customs_value ? [['Approximate value', `${d.customs_value} ${d.customs_currency || ''}`]] : []);
    const bioRows = Object.entries(biosecurity).map(([k,label]) => [label, d[k]]).concat(d.food_types.length ? [['Food types', d.food_types, true]] : [], d.bio_details ? [['Biosecurity details', d.bio_details, true]] : [], d.bio_luggage ? [['Where items are packed', d.bio_luggage]] : []);
    const baggageRows = ['checked_bags','carry_on_bags','travelling_with','other_items','additional_details','confirm_all_bags'].map(k=>[labels[k], d[k],k === 'additional_details']);
    const html = reviewCard('01 · About you',personal,1)+reviewCard('02 · Your journey',journey,2)+reviewCard('03 · Recent travel',travels,3)+reviewCard('04 · Customs',customsRows,4)+reviewCard('05 · Biosecurity',bioRows,5)+reviewCard('06 · Baggage and final details',baggageRows,6);
    document.getElementById('review-content').innerHTML = html;
    document.querySelectorAll('[data-edit-step]').forEach(btn=>btn.addEventListener('click',()=>showStep(Number(btn.dataset.editStep))));
  }
  function formatPrintRows(rows) {
    return rows.filter(r => r && r[0]).map(([label,value]) => `<div class="print-row"><strong>${escaped(label)}</strong><span>${escaped(prettify(value))}</span></div>`).join('');
  }
  function renderPrint() {
    const d = getData();
    const sections = [
      ['Identity and passport', ['family_name','given_names','birth_date','birth_country','nationality','usual_residence','occupation','passport_country','passport_number','passport_expiry','entry_status','permission_type'].map(k=>[labels[k],d[k]])],
      ['Arrival journey and contact details', ['travel_mode','arrival_date','arrival_port','origin_country','departure_port','departure_date','flight_number','airline','vessel_name','voyage_number','travel_purpose','stay_duration','address_line','city','postcode','email','phone'].filter(k=>d[k]).map(k=>[labels[k],d[k]])],
      ['Countries / territories visited in past 30 days', d.visits.map((v,i)=>[`${i+1}. ${v.country}`,`${v.from || 'Date not provided'}${v.to ? '–'+v.to : ''}${v.transit ? ' · Transit only' : ''}`])],
      ['Customs declarations',Object.entries(customs).map(([k,label])=>[label,d[k]]).concat([['Details',d.customs_details],['Estimated value',d.customs_value],['Currency',d.customs_currency]])],
      ['Biosecurity declarations',Object.entries(biosecurity).map(([k,label])=>[label,d[k]]).concat([['Food types',d.food_types],['Details',d.bio_details],['Location of items',d.bio_luggage]])],
      ['Baggage / other information',['checked_bags','carry_on_bags','travelling_with','other_items','additional_details','confirm_all_bags','signature_name','signature_date','guardian_name','confirm_truth'].map(k=>[labels[k],d[k]])]
    ];
    printSheet.innerHTML = `<header class="print-header"><div><h1>Traveller Declaration</h1><div>Square Country · Customs & Border Protection</div></div><div><strong>PREPARED COPY</strong><div>Not an official submission</div></div></header>`+
      sections.map(([name,items])=>`<section class="print-section"><h2>${escaped(name)}</h2><div class="print-grid">${formatPrintRows(items)}</div></section>`).join('')+
      `<div class="print-alert"><strong>Declaration:</strong> The signatory confirms that the information supplied is true, correct and complete to the best of their knowledge. This form is a locally prepared copy and has not been transmitted to any border authority.</div><div class="print-footer"><strong>Disclaimer:</strong> This website is a fictional representation of the Government of Square Country. Square Country is a fictional country and this website, its Ministries, agencies, legislation, services, and other content are created for fictional and entertainment purposes only. It does not represent a real government, country, institution, or organisation.</div>`;
  }
  function finish() {
    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) return;
    }
    renderPrint();
    complete = true;
    form.hidden = true;
    completeScreen.classList.add('active');
    setStatus('Your printable copy has been prepared. No information was transmitted.');
    document.querySelector('.form-page-card').scrollIntoView({behavior: 'auto', block:'start'});
  }
  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({schema:1, savedAt:new Date().toISOString(),answers:getData()}));
      setStatus('Draft saved in this browser on this device. It has not been submitted.');
    } catch(e) { setStatus('This browser could not save your draft. Use Download data instead.'); }
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setStatus('No saved draft was found in this browser.'); return; }
      const doc = JSON.parse(raw);
      if (doc.schema !== 1 || !doc.answers) throw new Error('Unrecognised draft format');
      applyData(doc.answers);
      setStatus('Saved draft loaded. Check your answers and continue.');
    } catch(e) { setStatus('Unable to load the saved draft: '+e.message); }
  }
  function deleteDraft() {
    if (!window.confirm('Delete the saved draft from this browser? Information currently entered on the page will remain until you start over or close the page.')) return;
    try { localStorage.removeItem(STORAGE_KEY); setStatus('The saved browser draft has been deleted.'); }
    catch(e){setStatus('Unable to delete the saved draft in this browser.');}
  }
  function downloadData() {
    if (!window.confirm('This download includes your passport and travel information. Keep the file private and secure. Continue?')) return;
    const file = {format:'square-country-traveller-declaration',schema:1,exportedAt:new Date().toISOString(),submitted:false,answers:getData()};
    const blob = new Blob([JSON.stringify(file,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'square-country-traveller-declaration.json';
    document.body.appendChild(a);
    a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),500);
    setStatus('Data file downloaded to your device. This is not a government submission.');
  }
  async function importData(file) {
    if (!file) return;
    if (file.size > 2000000) {setStatus('Import failed: the file is too large.');return;}
    try {
      const json=JSON.parse(await file.text());
      if (json.schema !== 1 || !json.answers || typeof json.answers !== 'object') throw new Error('Not a recognised declaration file');
      applyData(json.answers);
      setStatus('Declaration data imported. Review all answers before preparing a copy.');
    } catch(e){setStatus('Import failed: '+e.message);}
  }
  document.getElementById('add-visit').addEventListener('click',()=>createVisit());
  nextBtn.addEventListener('click',next);
  prevBtn.addEventListener('click',()=>{setError('');showStep(Math.max(1,current-1));});
  finishBtn.addEventListener('click',finish);
  navButtons.forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.navStep);if(n<=maxVisited && !complete){setError('');showStep(n);}}));
  form.addEventListener('change',()=>{updateConditionals();if(current===7)renderReview();});
  document.getElementById('save-draft').addEventListener('click',saveDraft);
  document.getElementById('load-draft').addEventListener('click',loadDraft);
  document.getElementById('delete-draft').addEventListener('click',deleteDraft);
  document.getElementById('download-data').addEventListener('click',downloadData);
  document.getElementById('download-final').addEventListener('click',downloadData);
  document.getElementById('import-data').addEventListener('click',()=>document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change',e=>{importData(e.target.files[0]);e.target.value='';});
  document.getElementById('print-final').addEventListener('click',()=>{renderPrint();window.print();});
  document.getElementById('edit-final').addEventListener('click',()=>{complete=false;form.hidden=false;completeScreen.classList.remove('active');showStep(7);});
  document.addEventListener('keydown',e=>{if(e.key==='Enter' && e.target.closest('#traveller-form') && e.target.tagName!=='TEXTAREA'){if(['INPUT','SELECT'].includes(e.target.tagName)){e.preventDefault();}}});
  // The date stamp is local to the traveller and can be edited.
  const now = new Date();
  form.elements.signature_date.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  createVisit();
  updateConditionals();
  showStep(1, false);
  try { if(localStorage.getItem(STORAGE_KEY)) setStatus('A saved draft is available on this device. Select Load saved draft to continue.'); } catch(e) {}
})();
