/* =====================================================
   INSURANCE.JS — MedPlus Insurance Comparison Page
===================================================== */

const INSURANCE_PLANS = [
  {
    id: 'mp-basic',
    name: 'MedPlus Shield Basic',
    company: 'MedPlus Health',
    tagline: 'Essential coverage for individuals',
    color: '#228080',
    letter: 'M',
    badge: '⭐ Best Value',
    type: ['individual'],
    coverageRange: 'low',
    sumInsured: '₹3 Lakh',
    annualPremium: 4500,
    hospitals: '5,000+',
    preExisting: 4,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'Ambulance charges', yes: true },
      { text: 'Day-care procedures (140+)', yes: true },
      { text: 'Pre & post hospitalisation', yes: true },
      { text: 'Maternity cover', yes: false },
      { text: 'OPD cover', yes: false },
      { text: 'Dental cover', yes: false },
      { text: 'International cover', yes: false },
    ],
    popular: 1
  },
  {
    id: 'star-family',
    name: 'Star Health Family',
    company: 'Star Health Insurance',
    tagline: 'Comprehensive family floater plan',
    color: '#dc2626',
    letter: 'S',
    badge: '🏆 Most Popular',
    type: ['individual', 'family'],
    coverageRange: 'low',
    sumInsured: '₹5 Lakh',
    annualPremium: 8200,
    hospitals: '9,500+',
    preExisting: 3,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'Ambulance charges', yes: true },
      { text: 'Day-care procedures (586+)', yes: true },
      { text: 'Maternity cover', yes: true },
      { text: 'Newborn baby cover', yes: true },
      { text: 'Teleconsultation', yes: true },
      { text: 'OPD cover', yes: false },
      { text: 'International cover', yes: false },
    ],
    popular: 3
  },
  {
    id: 'hdfc-optima',
    name: 'HDFC ERGO Optima',
    company: 'HDFC ERGO',
    tagline: 'Premium plan with restore benefit',
    color: '#1d4ed8',
    letter: 'H',
    badge: '💎 Premium',
    type: ['individual', 'family'],
    coverageRange: 'mid',
    sumInsured: '₹10 Lakh',
    annualPremium: 12800,
    hospitals: '10,000+',
    preExisting: 2,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'Sum Insured Restore', yes: true },
      { text: 'All day-care procedures', yes: true },
      { text: 'Maternity cover', yes: true },
      { text: 'Mental health cover', yes: true },
      { text: 'Annual health checkup', yes: true },
      { text: 'OPD cover (add-on)', yes: true },
      { text: 'International cover', yes: false },
    ],
    popular: 2
  },
  {
    id: 'niva-reassure',
    name: 'Niva Bupa ReAssure',
    company: 'Niva Bupa Health',
    tagline: 'Super top-up with unlimited cover',
    color: '#7c3aed',
    letter: 'N',
    badge: '🚀 Comprehensive',
    type: ['individual', 'family', 'senior'],
    coverageRange: 'high',
    sumInsured: '₹25 Lakh',
    annualPremium: 22500,
    hospitals: '8,500+',
    preExisting: 1,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'No room rent limit', yes: true },
      { text: 'All day-care procedures', yes: true },
      { text: 'OPD cover', yes: true },
      { text: 'Mental health cover', yes: true },
      { text: 'International cover (add-on)', yes: true },
      { text: 'Teleconsultation', yes: true },
      { text: 'Maternity cover', yes: true },
    ],
    popular: 4
  },
  {
    id: 'care-senior',
    name: 'Care Senior Citizen',
    company: 'Care Health Insurance',
    tagline: 'Tailored for 60+ age group',
    color: '#d97706',
    letter: 'C',
    badge: '👴 Senior Friendly',
    type: ['senior'],
    coverageRange: 'low',
    sumInsured: '₹4 Lakh',
    annualPremium: 16200,
    hospitals: '7,400+',
    preExisting: 2,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'Pre-existing on Day 1', yes: false },
      { text: 'Home care treatment', yes: true },
      { text: 'Annual health checkup', yes: true },
      { text: 'Teleconsultation', yes: true },
      { text: 'Companion benefit', yes: true },
      { text: 'Maternity cover', yes: false },
      { text: 'No medical test (up to 75)', yes: true },
    ],
    popular: 5
  },
  {
    id: 'max-bupa',
    name: 'Niva Bupa Health Premia',
    company: 'Niva Bupa Health',
    tagline: 'Lifetime deductible with bonuses',
    color: '#0f766e',
    letter: 'N',
    badge: '✨ Best for Young',
    type: ['individual', 'family'],
    coverageRange: 'mid',
    sumInsured: '₹15 Lakh',
    annualPremium: 9800,
    hospitals: '8,500+',
    preExisting: 2,
    features: [
      { text: 'Hospitalisation cover', yes: true },
      { text: 'No claim bonus (100%)', yes: true },
      { text: 'Direct claim settlement', yes: true },
      { text: 'Maternity cover', yes: true },
      { text: 'Teleconsultation', yes: true },
      { text: 'OPD add-on available', yes: true },
      { text: 'International cover', yes: false },
      { text: 'Dental cover', yes: false },
    ],
    popular: 2
  }
];

const FAQS = [
  {
    q: 'What is a health insurance floater plan?',
    a: 'A family floater plan covers all members of your family under a single sum insured. If one member uses the coverage, it reduces the available cover for others in that policy year. It is generally more cost-effective than individual plans for each family member.'
  },
  {
    q: 'What is a pre-existing disease waiting period?',
    a: 'A waiting period is the time you must wait before your insurer will cover treatment for a pre-existing condition. This ranges from 1–4 years depending on the plan. After this period, your policy will cover treatment related to pre-existing illnesses.'
  },
  {
    q: 'How does cashless hospitalisation work?',
    a: 'If you get admitted to a network hospital, you can avail of cashless treatment. The insurance company settles the bill directly with the hospital — you pay only any amounts not covered by the policy. Always carry your health card and inform the insurer within the required time frame.'
  },
  {
    q: 'What is No Claim Bonus (NCB)?',
    a: 'NCB is a reward for not making a claim in a policy year. Your sum insured is increased (usually 10–50%) at renewal without any additional premium. This helps your coverage grow over time as long as you remain healthy.'
  },
  {
    q: 'Can I port my health insurance to another insurer?',
    a: 'Yes! Under IRDAI regulations, you can port your existing health insurance policy to a new insurer at the time of renewal. Your accumulated waiting period benefits are carried over to the new policy. You must apply for portability at least 45 days before renewal.'
  },
  {
    q: 'Are there tax benefits on health insurance premium?',
    a: 'Yes. Under Section 80D of the Income Tax Act, you can claim deductions of up to ₹25,000 per year for premiums paid for yourself, spouse, and children. An additional ₹25,000 can be claimed for parents (₹50,000 if they are senior citizens).'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  renderPlans(INSURANCE_PLANS);
  renderFAQs();
});

function initNavAuth() {
  const user    = currentUser();
  const loginBtn = document.getElementById('nav-login');
  const profBtn  = document.getElementById('nav-profile');
  const cc       = document.getElementById('cart-count');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (profBtn)  { profBtn.style.display = ''; profBtn.innerHTML = '<i class="fas fa-user"></i> ' + user.name.split(' ')[0]; }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (profBtn)  profBtn.style.display = 'none';
  }

  if (cc) {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const qty  = cart.reduce((s, i) => s + (i.qty || 1), 0);
      cc.textContent = qty;
      cc.style.display = qty > 0 ? '' : 'none';
    } catch(e) {}
  }
}

function filterPlans() {
  const memberType = document.getElementById('members-filter')?.value || 'individual';
  const coverage   = document.getElementById('coverage-filter')?.value || 'all';
  const sortBy     = document.getElementById('sort-plans')?.value || 'popular';

  let filtered = INSURANCE_PLANS.filter(p => {
    if (!p.type.includes(memberType)) return false;
    if (coverage === 'low' && p.coverageRange !== 'low') return false;
    if (coverage === 'mid' && p.coverageRange !== 'mid') return false;
    if (coverage === 'high' && p.coverageRange !== 'high') return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'price-asc')  return a.annualPremium - b.annualPremium;
    if (sortBy === 'price-desc') return b.annualPremium - a.annualPremium;
    if (sortBy === 'coverage')   return parseCoverage(b.sumInsured) - parseCoverage(a.sumInsured);
    return a.popular - b.popular;
  });

  renderPlans(filtered);
}

function parseCoverage(str) {
  const n = parseFloat(str.replace(/[^0-9.]/g, ''));
  return str.includes('Lakh') ? n * 100000 : n;
}

function renderPlans(plans) {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;

  if (!plans.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary)">
        <i class="fas fa-search" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:.3"></i>
        No plans match your filters. Try different criteria.
      </div>`;
    return;
  }

  grid.innerHTML = plans.map(p => `
    <div class="insurance-card">
      <div class="insurance-card-header">
        <div class="insurance-logo" style="background:${p.color}">${p.letter}</div>
        <div>
          <div class="insurance-name">${p.name}</div>
          <div class="insurance-tagline">${p.company}</div>
        </div>
        <div class="insurance-badge">${p.badge}</div>
      </div>
      <div class="insurance-card-body">
        <div class="insurance-premium">₹${p.annualPremium.toLocaleString('en-IN')} <span>/ year</span></div>
        <div class="insurance-coverage">
          <strong>Sum Insured:</strong> ${p.sumInsured} &nbsp;|&nbsp;
          <strong>Pre-existing:</strong> ${p.preExisting} yr wait &nbsp;|&nbsp;
          <strong>Hospitals:</strong> ${p.hospitals}
        </div>
        <ul class="insurance-features">
          ${p.features.map(f => `
            <li class="${f.yes ? '' : 'no'}">
              <i class="fas ${f.yes ? 'fa-check-circle' : 'fa-times-circle'}"></i>
              ${f.text}
            </li>
          `).join('')}
        </ul>
        <div style="display:flex;gap:.75rem">
          <button class="btn-insurance btn-insurance-primary" onclick="buyPlan('${p.id}','${p.name}')">
            <i class="fas fa-shield-alt"></i> Buy Now
          </button>
          <button class="btn-insurance btn-insurance-outline" onclick="comparePlan('${p.id}')">
            Compare
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFAQs() {
  const container = document.getElementById('faq-list');
  if (!container) return;

  container.innerHTML = FAQS.map((faq, i) => `
    <div class="faq-item" id="faq-${i}">
      <div class="faq-question" onclick="toggleFAQ(${i})">
        <span>${faq.q}</span>
        <i class="fas fa-chevron-down faq-chevron"></i>
      </div>
      <div class="faq-answer" id="faq-ans-${i}">${faq.a}</div>
    </div>
  `).join('');
}

function toggleFAQ(i) {
  const item = document.getElementById('faq-' + i);
  const ans  = document.getElementById('faq-ans-' + i);
  if (!item || !ans) return;
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('open'));
  // Open this one if it was closed
  if (!isOpen) {
    item.classList.add('open');
    ans.classList.add('open');
  }
}

function buyPlan(id, name) {
  // In a real app this would redirect to a purchase flow
  alert(`Redirecting to purchase "${name}"…\n\nIn a real integration, this would open the insurer's official purchase portal or a guided flow.`);
}

function comparePlan(id) {
  alert('Plan comparison details would be shown here in a full implementation. Scroll down to the comparison table for feature-by-feature breakdown.');
}
