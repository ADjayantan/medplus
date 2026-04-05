/* =====================================================
   SEED.JS — MedPlus Pharmacy
   100+ Real medicines with full details
   Run: node backend/seed.js
===================================================== */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Product  = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medplus';

/* ── SVG placeholder images by category color ── */
const IMG = {
  pain:      (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23ede9fe'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%237c3aed' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%237c3aed' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%237c3aed' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%237c3aed' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%237c3aed' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%236d28d9' font-family='sans-serif'%3EPain Relief%3C/text%3E%3C/svg%3E`,
  antibiotic:(label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23d1fae5'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23059669' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23059669' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23059669' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23059669' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23059669' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23065f46' font-family='sans-serif'%3EAntibiotics%3C/text%3E%3C/svg%3E`,
  allergy:   (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e0f2fe'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%230284c7' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%230284c7' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%230284c7' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%230284c7' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%230284c7' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%230369a1' font-family='sans-serif'%3EAllergy %26 Cold%3C/text%3E%3C/svg%3E`,
  diabetes:  (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fee2e2'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23dc2626' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23dc2626' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23dc2626' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23dc2626' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23dc2626' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23991b1b' font-family='sans-serif'%3EDiabetes%3C/text%3E%3C/svg%3E`,
  heart:     (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fce7f3'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23db2777' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23db2777' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23db2777' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23db2777' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23db2777' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%239d174d' font-family='sans-serif'%3EHeart %26 BP%3C/text%3E%3C/svg%3E`,
  vitamin:   (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fef3c7'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23d97706' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23d97706' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23d97706' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23d97706' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23d97706' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23b45309' font-family='sans-serif'%3EVitamins%3C/text%3E%3C/svg%3E`,
  stomach:   (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fef9c3'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23ca8a04' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23ca8a04' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23ca8a04' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23ca8a04' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23ca8a04' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23a16207' font-family='sans-serif'%3EStomach%3C/text%3E%3C/svg%3E`,
  resp:      (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23dbeafe'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%232563eb' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%232563eb' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%232563eb' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%232563eb' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%232563eb' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%231d4ed8' font-family='sans-serif'%3ERespiratory%3C/text%3E%3C/svg%3E`,
  skin:      (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23d1fae5'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23059669' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23059669' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23059669' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23059669' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23059669' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23065f46' font-family='sans-serif'%3ESkin Care%3C/text%3E%3C/svg%3E`,
  baby:      (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23eff6ff'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%233b82f6' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%233b82f6' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%233b82f6' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%233b82f6' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%233b82f6' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%231d4ed8' font-family='sans-serif'%3EBaby Care%3C/text%3E%3C/svg%3E`,
  eye:       (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0fdf4'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%2316a34a' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%2316a34a' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%2316a34a' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%2316a34a' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%2316a34a' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23166534' font-family='sans-serif'%3EEye Care%3C/text%3E%3C/svg%3E`,
  women:     (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fdf2f8'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23a21caf' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23a21caf' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23a21caf' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23a21caf' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23a21caf' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%2386198f' font-family='sans-serif'%3EWomen Health%3C/text%3E%3C/svg%3E`,
  neuro:     (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f5f3ff'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%237c3aed' opacity='.2'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%237c3aed' opacity='.35'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%237c3aed' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%237c3aed' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%237c3aed' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%236d28d9' font-family='sans-serif'%3ENeurology%3C/text%3E%3C/svg%3E`,
  liver:     (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fff7ed'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%23ea580c' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%23ea580c' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%23ea580c' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%23ea580c' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%23ea580c' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23c2410c' font-family='sans-serif'%3ELiver Care%3C/text%3E%3C/svg%3E`,
  firstaid:  (label) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0fdf4'/%3E%3Ccircle cx='150' cy='110' r='55' fill='%2322c55e' opacity='.18'/%3E%3Ccircle cx='150' cy='110' r='36' fill='%2322c55e' opacity='.3'/%3E%3Crect x='60' y='175' width='180' height='14' rx='7' fill='%2322c55e' opacity='.15'/%3E%3Crect x='80' y='197' width='140' height='10' rx='5' fill='%2322c55e' opacity='.1'/%3E%3Ctext x='150' y='118' text-anchor='middle' font-size='28' font-weight='700' fill='%2316a34a' font-family='sans-serif'%3E${encodeURIComponent(label)}%3C/text%3E%3Ctext x='150' y='255' text-anchor='middle' font-size='13' fill='%23166534' font-family='sans-serif'%3EFirst Aid%3C/text%3E%3C/svg%3E`,
};

const products = [

  /* ══════════════════════════════════════════
     PAIN RELIEF — 12 products
  ══════════════════════════════════════════ */
  {
    name:'Paracetamol 500mg',
    price:18, mrp:25, category:'Pain Relief',
    manufacturer:'Sun Pharma', rating:4.6, reviews:1420, stock:true, requiresPrescription:false,
    image: IMG.pain('PCM'),
    description:'Paracetamol 500mg is the most widely used analgesic (pain reliever) and antipyretic (fever reducer) in India. It effectively reduces mild to moderate pain including headache, toothache, backache, and musculoskeletal pain, and lowers elevated body temperature. Safe for adults and children above 12 years. Each strip contains 10 tablets.',
    tags:['fever','pain','headache','paracetamol','antipyretic','analgesic']
  },
  {
    name:'Dolo 650',
    price:22, mrp:30, category:'Pain Relief',
    manufacturer:'Micro Labs', rating:4.8, reviews:3250, stock:true, requiresPrescription:false,
    image: IMG.pain('DOLO'),
    description:"Dolo 650 contains Paracetamol 650mg — India's most trusted fever and pain relief tablet. The higher dose (650mg) is particularly effective for stronger fever, flu symptoms, COVID-related fever, and moderate pain. Fast-acting formula works within 30 minutes. Non-drowsy. Safe for diabetic patients. Strip of 15 tablets.",
    tags:['fever','pain','flu','covid fever','paracetamol 650','dolo']
  },
  {
    name:'Ibuprofen 400mg',
    price:32, mrp:45, category:'Pain Relief',
    manufacturer:'Cipla', rating:4.3, reviews:890, stock:true, requiresPrescription:false,
    image: IMG.pain('IBU'),
    description:'Ibuprofen 400mg is a non-steroidal anti-inflammatory drug (NSAID) that relieves pain, reduces inflammation, and lowers fever. Effective for arthritis pain, dental pain, menstrual cramps, sports injuries, and post-surgical pain. Take with food to reduce stomach irritation. Strip of 10 tablets.',
    tags:['pain','inflammation','arthritis','nsaid','ibuprofen','fever']
  },
  {
    name:'Diclofenac 50mg',
    price:28, mrp:38, category:'Pain Relief',
    manufacturer:'Novartis', rating:4.4, reviews:672, stock:true, requiresPrescription:false,
    image: IMG.pain('DIC'),
    description:'Diclofenac Sodium 50mg is a potent NSAID used to treat acute and chronic pain including osteoarthritis, rheumatoid arthritis, ankylosing spondylitis, and musculoskeletal disorders. Also effective for dental pain and post-operative pain. Take with meals.',
    tags:['pain','arthritis','joint pain','nsaid','diclofenac','muscle pain']
  },
  {
    name:'Aceclofenac 100mg + Paracetamol 325mg',
    price:45, mrp:62, category:'Pain Relief',
    manufacturer:'Mankind Pharma', rating:4.5, reviews:534, stock:true, requiresPrescription:false,
    image: IMG.pain('ACE-P'),
    description:'Combination tablet of Aceclofenac 100mg and Paracetamol 325mg for effective relief from moderate to severe pain and inflammation. Commonly prescribed for osteoarthritis, rheumatoid arthritis, dental pain, and post-operative pain. The dual mechanism provides faster and more complete pain relief.',
    tags:['pain','arthritis','combination','aceclofenac','paracetamol','joint']
  },
  {
    name:'Meftal Spas 250mg',
    price:38, mrp:52, category:'Pain Relief',
    manufacturer:'Blue Cross', rating:4.6, reviews:1180, stock:true, requiresPrescription:false,
    image: IMG.pain('MFS'),
    description:"Meftal Spas contains Mefenamic Acid 250mg + Dicyclomine 10mg. India's #1 prescribed tablet for menstrual cramps (dysmenorrhea) and spasmodic abdominal pain. Provides fast relief from period pain, stomach cramps, and IBS-related discomfort within 15-20 minutes. Pack of 10 tablets.",
    tags:['period pain','menstrual cramps','dysmenorrhea','spasm','mefenamic acid','women']
  },
  {
    name:'Tramadol 50mg',
    price:65, mrp:90, category:'Pain Relief',
    manufacturer:'Lupin', rating:4.1, reviews:287, stock:true, requiresPrescription:true,
    image: IMG.pain('TRM'),
    description:'Tramadol Hydrochloride 50mg is a centrally-acting opioid analgesic for moderate to moderately severe pain. Used for post-surgical pain, cancer pain, severe musculoskeletal conditions, and neuropathic pain. Prescription mandatory. Avoid alcohol. Do not drive while on medication.',
    tags:['severe pain','opioid','post-surgical','tramadol','narcotic','prescription']
  },
  {
    name:'Nimesulide 100mg',
    price:24, mrp:34, category:'Pain Relief',
    manufacturer:'Dr. Reddy\'s', rating:4.2, reviews:445, stock:true, requiresPrescription:false,
    image: IMG.pain('NIM'),
    description:'Nimesulide 100mg is a selective COX-2 inhibitor NSAID with analgesic, anti-inflammatory, and antipyretic properties. Effective for fever, osteoarthritis pain, acute pain from trauma, and dysmenorrhea. Take after meals. Not recommended for children under 12 years.',
    tags:['pain','fever','nsaid','nimesulide','cox-2','anti-inflammatory']
  },
  {
    name:'Aspirin 75mg (Ecosprin)',
    price:18, mrp:25, category:'Pain Relief',
    manufacturer:'USV Ltd', rating:4.7, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.pain('ASP'),
    description:'Ecosprin Aspirin 75mg is used as an antiplatelet drug to prevent blood clots, heart attacks, and strokes in high-risk patients. Also used for mild pain and fever. The enteric-coated tablet reduces stomach irritation. Widely used in cardiac care across India.',
    tags:['aspirin','antiplatelet','cardiac','heart attack prevention','ecosprin','blood thinner']
  },
  {
    name:'Muscle Relaxant — Cyclobenzaprine 10mg',
    price:88, mrp:120, category:'Pain Relief',
    manufacturer:'Abbott', rating:4.0, reviews:198, stock:true, requiresPrescription:true,
    image: IMG.pain('MYO'),
    description:'Cyclobenzaprine 10mg is a centrally-acting skeletal muscle relaxant. Used to treat muscle spasms, stiffness, and pain associated with musculoskeletal conditions. Often prescribed along with physical therapy. May cause drowsiness — avoid driving. Prescription required.',
    tags:['muscle relaxant','spasm','back pain','cyclobenzaprine','stiffness']
  },
  {
    name:'Combiflam Tablet',
    price:35, mrp:48, category:'Pain Relief',
    manufacturer:'Sanofi India', rating:4.7, reviews:4120, stock:true, requiresPrescription:false,
    image: IMG.pain('CMB'),
    description:"Combiflam contains Ibuprofen 400mg + Paracetamol 325mg. India's best-selling combination pain-relief tablet. Dual mechanism attacks pain and fever from two angles simultaneously — Ibuprofen reduces inflammation while Paracetamol lowers temperature. Fast 20-minute action. Strip of 20 tablets.",
    tags:['combiflam','ibuprofen','paracetamol','fever','combination','pain relief']
  },
  {
    name:'Voveran SR 100mg (Diclofenac SR)',
    price:52, mrp:72, category:'Pain Relief',
    manufacturer:'Novartis', rating:4.3, reviews:356, stock:true, requiresPrescription:false,
    image: IMG.pain('VOV'),
    description:'Voveran SR (Diclofenac Sodium Sustained Release) 100mg provides extended pain relief for up to 12 hours. One tablet twice daily manages chronic pain conditions like arthritis, spondylitis, and sports injuries without frequent dosing. Sustained release minimizes GI side effects.',
    tags:['diclofenac','sustained release','arthritis','chronic pain','sr tablet','voveran']
  },

  /* ══════════════════════════════════════════
     ANTIBIOTICS — 10 products
  ══════════════════════════════════════════ */
  {
    name:'Amoxicillin 500mg',
    price:120, mrp:160, category:'Antibiotics',
    manufacturer:'Dr. Reddy\'s', rating:4.6, reviews:980, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('AMX'),
    description:'Amoxicillin 500mg is a broad-spectrum penicillin-type antibiotic effective against gram-positive and gram-negative bacteria. Prescribed for respiratory tract infections (pneumonia, bronchitis), urinary tract infections, skin infections, and dental infections. Complete the full course even if you feel better. Strip of 10 capsules.',
    tags:['antibiotic','amoxicillin','respiratory infection','UTI','penicillin','bacterial']
  },
  {
    name:'Azithromycin 500mg (Z-Pack)',
    price:95, mrp:130, category:'Antibiotics',
    manufacturer:'Cipla', rating:4.5, reviews:756, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('AZI'),
    description:'Azithromycin 500mg is a macrolide antibiotic with broad-spectrum activity. A 3-day or 5-day course treats community-acquired pneumonia, sinusitis, pharyngitis, skin infections, and sexually transmitted diseases. Taken once daily, convenient single-dose regimen. Avoid antacids within 2 hours of dose.',
    tags:['azithromycin','zpack','z-pak','macrolide','pneumonia','sinusitis','antibiotic']
  },
  {
    name:'Ciprofloxacin 500mg',
    price:85, mrp:115, category:'Antibiotics',
    manufacturer:'Bayer', rating:4.4, reviews:612, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('CIP'),
    description:'Ciprofloxacin 500mg is a fluoroquinolone antibiotic with activity against a wide range of bacteria. Commonly prescribed for UTIs, diarrhea, typhoid, respiratory infections, bone/joint infections, and as anthrax prophylaxis. Take with plenty of water. Avoid dairy products and antacids during treatment.',
    tags:['ciprofloxacin','UTI','typhoid','quinolone','antibiotic','fluoroquinolone','diarrhea']
  },
  {
    name:'Doxycycline 100mg',
    price:78, mrp:105, category:'Antibiotics',
    manufacturer:'Pfizer', rating:4.3, reviews:445, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('DOX'),
    description:'Doxycycline 100mg is a tetracycline antibiotic prescribed for malaria prophylaxis, chlamydia, Lyme disease, acne, cholera, and various other bacterial infections. Take with a full glass of water and do not lie down for 30 minutes. Avoid sun exposure (photosensitivity). Do not take with antacids or dairy.',
    tags:['doxycycline','tetracycline','malaria','chlamydia','acne','antibiotic','Lyme']
  },
  {
    name:'Metronidazole 400mg (Flagyl)',
    price:38, mrp:52, category:'Antibiotics',
    manufacturer:'Abbott', rating:4.5, reviews:534, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('MET'),
    description:'Metronidazole 400mg (Flagyl) is an antibiotic and antiprotozoal agent effective against anaerobic bacteria and parasites. Used to treat amoebiasis, giardiasis, bacterial vaginosis, stomach ulcers caused by H. pylori, and dental infections. Strictly avoid alcohol during and 48 hours after treatment.',
    tags:['metronidazole','flagyl','amoeba','giardia','anaerobic','antiprotozoal','ulcer','H.pylori']
  },
  {
    name:'Cephalexin 500mg',
    price:110, mrp:148, category:'Antibiotics',
    manufacturer:'Ranbaxy (Sun)', rating:4.2, reviews:289, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('CEF'),
    description:'Cephalexin 500mg is a first-generation cephalosporin antibiotic used for treating skin infections, strep throat, urinary tract infections, and bone infections. Well-tolerated in penicillin-sensitive patients (with caution). Can be taken with or without food.',
    tags:['cephalexin','cephalosporin','skin infection','strep throat','UTI','antibiotic']
  },
  {
    name:'Augmentin 625mg (Amoxicillin+Clavulanate)',
    price:245, mrp:325, category:'Antibiotics',
    manufacturer:'GSK', rating:4.7, reviews:1240, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('AUG'),
    description:'Augmentin 625mg combines Amoxicillin 500mg with Clavulanate 125mg to overcome antibiotic resistance. Used for complicated respiratory infections, sinusitis, skin and soft tissue infections, UTIs, and dental abscesses. Effective against beta-lactamase-producing bacteria. Take at the start of a meal.',
    tags:['augmentin','amoxicillin clavulanate','co-amoxiclav','penicillin','resistant infection','antibiotic']
  },
  {
    name:'Clarithromycin 250mg',
    price:145, mrp:195, category:'Antibiotics',
    manufacturer:'Abbott', rating:4.3, reviews:312, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('CLR'),
    description:'Clarithromycin 250mg is a macrolide antibiotic used for respiratory tract infections including community-acquired pneumonia, sinusitis, bronchitis, and H. pylori eradication (in triple therapy for peptic ulcers). Can be taken with or without food. Common uses: 7-14 day courses.',
    tags:['clarithromycin','macrolide','H.pylori','pneumonia','sinusitis','antibiotic','triple therapy']
  },
  {
    name:'Nitrofurantoin 100mg (Macrobid)',
    price:95, mrp:128, category:'Antibiotics',
    manufacturer:'Procter & Gamble', rating:4.4, reviews:398, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('NIT'),
    description:'Nitrofurantoin 100mg (modified release) is specifically used for uncomplicated urinary tract infections (UTIs) caused by susceptible strains. High urinary concentrations make it ideal for lower UTI treatment. Take with food to reduce nausea. Complete the 5-7 day course. Not for kidney infection.',
    tags:['nitrofurantoin','UTI','urinary tract infection','bladder infection','macrobid','antibiotic']
  },
  {
    name:'Levofloxacin 500mg',
    price:165, mrp:220, category:'Antibiotics',
    manufacturer:'Mankind', rating:4.4, reviews:267, stock:true, requiresPrescription:true,
    image: IMG.antibiotic('LEV'),
    description:'Levofloxacin 500mg is a third-generation fluoroquinolone antibiotic with excellent tissue penetration. Used for community-acquired pneumonia, chronic bronchitis exacerbations, sinusitis, UTIs, and skin infections. Once-daily dosing. Avoid excess sunlight. Not for patients under 18 or pregnant women.',
    tags:['levofloxacin','quinolone','pneumonia','respiratory','UTI','antibiotic','once-daily']
  },

  /* ══════════════════════════════════════════
     ALLERGY & COLD — 8 products
  ══════════════════════════════════════════ */
  {
    name:'Cetirizine 10mg',
    price:22, mrp:30, category:'Allergy & Cold',
    manufacturer:'Cipla', rating:4.6, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.allergy('CTZ'),
    description:'Cetirizine 10mg is a second-generation antihistamine that provides 24-hour relief from allergic rhinitis, urticaria (hives), hay fever, and skin allergies. Causes less sedation than first-generation antihistamines. Suitable for adults and children above 12. Take at night if any drowsiness occurs.',
    tags:['cetirizine','antihistamine','allergy','hay fever','urticaria','hives','rhinitis']
  },
  {
    name:'Loratadine 10mg (Claritin)',
    price:28, mrp:38, category:'Allergy & Cold',
    manufacturer:'Bayer', rating:4.4, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.allergy('LOR'),
    description:'Loratadine 10mg is a non-drowsy, non-sedating antihistamine for 24-hour allergy relief. Effective for seasonal and perennial allergic rhinitis, chronic urticaria, and insect bite reactions. Suitable for daytime use — does not affect driving ability. Can be taken with or without food.',
    tags:['loratadine','claritin','non-drowsy','antihistamine','allergy','urticaria','seasonal']
  },
  {
    name:'Fexofenadine 120mg (Allegra)',
    price:52, mrp:72, category:'Allergy & Cold',
    manufacturer:'Sanofi', rating:4.7, reviews:1890, stock:true, requiresPrescription:false,
    image: IMG.allergy('FEX'),
    description:"Fexofenadine 120mg (Allegra) is the most modern non-sedating antihistamine. Provides fast-acting relief from seasonal allergic rhinitis, chronic idiopathic urticaria, and sneezing/runny nose due to allergies. Does not cross the blood-brain barrier — zero drowsiness. India's preferred antihistamine for daytime allergy relief.",
    tags:['fexofenadine','allegra','non-drowsy','antihistamine','seasonal allergy','urticaria','fast relief']
  },
  {
    name:'Montelukast 10mg (Singulair)',
    price:88, mrp:120, category:'Allergy & Cold',
    manufacturer:'Merck', rating:4.5, reviews:934, stock:true, requiresPrescription:true,
    image: IMG.allergy('MON'),
    description:'Montelukast 10mg is a leukotriene receptor antagonist used for asthma prophylaxis and allergic rhinitis. Controls inflammation in airways, reduces asthma symptoms, and prevents exercise-induced bronchospasm. Often used in combination with antihistamines for complete allergy control. Take in the evening.',
    tags:['montelukast','singulair','asthma','leukotriene','allergy','rhinitis','respiratory allergy']
  },
  {
    name:'Levocetrizine 5mg',
    price:35, mrp:48, category:'Allergy & Cold',
    manufacturer:'UCB India', rating:4.5, reviews:1120, stock:true, requiresPrescription:false,
    image: IMG.allergy('LCZ'),
    description:'Levocetirizine 5mg is the active R-enantiomer of cetirizine with superior potency at half the dose. Provides 24-hour relief from allergic rhinitis, chronic urticaria, atopic dermatitis, and allergic conjunctivitis. Minimal sedation. Ideal for patients who experience drowsiness with cetirizine.',
    tags:['levocetirizine','xyzal','antihistamine','allergy','urticaria','rhinitis','low drowsiness']
  },
  {
    name:'Nasal Decongestant — Xylometazoline 0.1%',
    price:45, mrp:62, category:'Allergy & Cold',
    manufacturer:'Cipla', rating:4.4, reviews:567, stock:true, requiresPrescription:false,
    image: IMG.allergy('XYL'),
    description:'Xylometazoline 0.1% nasal spray provides instant relief from nasal congestion due to cold, sinusitis, and allergic rhinitis. Works within 2 minutes and lasts 8-10 hours. Two sprays per nostril — do not use for more than 3-5 consecutive days to prevent rebound congestion (rhinitis medicamentosa).',
    tags:['xylometazoline','nasal spray','decongestant','blocked nose','sinusitis','cold','congestion']
  },
  {
    name:'Diphenhydramine 25mg (Benadryl)',
    price:28, mrp:38, category:'Allergy & Cold',
    manufacturer:'Pfizer', rating:4.2, reviews:445, stock:true, requiresPrescription:false,
    image: IMG.allergy('DPH'),
    description:'Diphenhydramine 25mg (Benadryl) is a first-generation antihistamine and mild sedative. Relieves allergy symptoms, motion sickness, insomnia, and cold symptoms. The sedating effect makes it useful as a short-term sleep aid. Causes drowsiness — do not drive or operate machinery.',
    tags:['diphenhydramine','benadryl','antihistamine','sleep aid','motion sickness','drowsy','allergy']
  },
  {
    name:'Cold & Flu — Sinarest Tablet',
    price:32, mrp:44, category:'Allergy & Cold',
    manufacturer:'Centaur Pharma', rating:4.5, reviews:2130, stock:true, requiresPrescription:false,
    image: IMG.allergy('SNR'),
    description:"Sinarest contains Paracetamol 325mg + Phenylephrine 5mg + Cetirizine 5mg. India's top-selling cold and flu tablet. Treats all symptoms simultaneously: fever, blocked nose, runny nose, sneezing, body ache, and headache. Fast-acting 3-in-1 formula. Day formulation — mild drowsiness possible.",
    tags:['sinarest','cold','flu','combination','paracetamol','phenylephrine','cetirizine','runny nose']
  },

  /* ══════════════════════════════════════════
     DIABETES — 10 products
  ══════════════════════════════════════════ */
  {
    name:'Metformin 500mg',
    price:45, mrp:60, category:'Diabetes',
    manufacturer:'Sun Pharma', rating:4.8, reviews:3450, stock:true, requiresPrescription:true,
    image: IMG.diabetes('MET'),
    description:"Metformin 500mg is the world's most prescribed oral antidiabetic drug and the first-line treatment for Type 2 diabetes. Reduces hepatic glucose production, improves insulin sensitivity, and lowers blood sugar without causing hypoglycemia. Also used for PCOS management. Take with or after meals. Generic name: Metformin Hydrochloride.",
    tags:['metformin','type 2 diabetes','blood sugar','insulin resistance','PCOS','antidiabetic','glucophage']
  },
  {
    name:'Metformin 1000mg (Extended Release)',
    price:72, mrp:96, category:'Diabetes',
    manufacturer:'Cipla', rating:4.7, reviews:1890, stock:true, requiresPrescription:true,
    image: IMG.diabetes('MXR'),
    description:'Metformin 1000mg Extended Release provides sustained glycemic control with once-daily dosing. The slow-release formulation significantly reduces gastrointestinal side effects (nausea, diarrhea) compared to immediate-release tablets. Take with evening meal. Swallow whole, do not crush.',
    tags:['metformin XR','extended release','type 2 diabetes','glycemic control','once daily','antidiabetic']
  },
  {
    name:'Glipizide 5mg',
    price:55, mrp:75, category:'Diabetes',
    manufacturer:'Pfizer', rating:4.4, reviews:678, stock:true, requiresPrescription:true,
    image: IMG.diabetes('GLP'),
    description:'Glipizide 5mg is a second-generation sulfonylurea that stimulates insulin secretion from pancreatic beta cells. Used for Type 2 diabetes when lifestyle changes are insufficient. Take 30 minutes before meals. Monitor blood sugar. May cause hypoglycemia — carry glucose tablets.',
    tags:['glipizide','sulfonylurea','type 2 diabetes','insulin secretagogue','antidiabetic','hypoglycemia']
  },
  {
    name:'Sitagliptin 100mg (Januvia)',
    price:285, mrp:380, category:'Diabetes',
    manufacturer:'MSD (Merck)', rating:4.6, reviews:892, stock:true, requiresPrescription:true,
    image: IMG.diabetes('SIT'),
    description:'Sitagliptin 100mg (Januvia) is a DPP-4 inhibitor that enhances the incretin effect to control blood sugar. Weight-neutral, low risk of hypoglycemia, once-daily dosing. Used as monotherapy or combined with metformin/sulfonylureas. Good kidney safety profile at reduced doses.',
    tags:['sitagliptin','januvia','DPP-4','incretin','type 2 diabetes','weight neutral','once daily']
  },
  {
    name:'Empagliflozin 10mg (Jardiance)',
    price:465, mrp:620, category:'Diabetes',
    manufacturer:'Boehringer Ingelheim', rating:4.8, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.diabetes('EMP'),
    description:'Empagliflozin 10mg (Jardiance) is an SGLT-2 inhibitor that lowers blood sugar by causing kidneys to excrete excess glucose in urine. Also proven to reduce cardiovascular death and slow kidney disease progression in diabetic patients. Causes mild diuresis and modest weight loss. Take in morning.',
    tags:['empagliflozin','jardiance','SGLT2','heart failure','kidney protection','weight loss','antidiabetic']
  },
  {
    name:'Glimepiride 2mg + Metformin 500mg',
    price:85, mrp:115, category:'Diabetes',
    manufacturer:'Mankind', rating:4.5, reviews:1240, stock:true, requiresPrescription:true,
    image: IMG.diabetes('G-M'),
    description:'Fixed-dose combination of Glimepiride 2mg (sulfonylurea) and Metformin 500mg for comprehensive Type 2 diabetes management. Dual mechanism: Glimepiride stimulates insulin release + Metformin reduces hepatic glucose production + improves insulin sensitivity. One tablet twice daily with meals.',
    tags:['glimepiride','metformin','combination','type 2 diabetes','sulfonylurea','dual therapy','antidiabetic']
  },
  {
    name:'Voglibose 0.3mg (Volix)',
    price:95, mrp:128, category:'Diabetes',
    manufacturer:'Biocon', rating:4.3, reviews:356, stock:true, requiresPrescription:true,
    image: IMG.diabetes('VOG'),
    description:'Voglibose 0.3mg is an alpha-glucosidase inhibitor that delays carbohydrate digestion in the gut, reducing post-meal blood sugar spikes. Particularly effective in managing postprandial hyperglycemia. Take just before meals. GI side effects (flatulence, diarrhea) usually subside after 4 weeks.',
    tags:['voglibose','alpha glucosidase','postprandial','blood sugar','antidiabetic','volix','IGT']
  },
  {
    name:'Insulin Glargine (Lantus) 100U/mL',
    price:890, mrp:1180, category:'Diabetes',
    manufacturer:'Sanofi', rating:4.9, reviews:1560, stock:true, requiresPrescription:true,
    image: IMG.diabetes('INS'),
    description:'Insulin Glargine (Lantus) is a long-acting basal insulin analogue providing 24-hour glucose control with no pronounced peak. Used for both Type 1 and Type 2 diabetes. Inject subcutaneously once daily at the same time each day. Store in refrigerator (2-8°C). 1 vial = 10mL (1000 units).',
    tags:['insulin','lantus','glargine','basal insulin','type 1 diabetes','long acting','injection']
  },
  {
    name:'Glucometer Strips — Accu-Chek Active (50 strips)',
    price:550, mrp:720, category:'Diabetes',
    manufacturer:'Roche', rating:4.8, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.diabetes('ACC'),
    description:'Accu-Chek Active Test Strips (50 count) for accurate blood glucose monitoring at home. Compatible only with Accu-Chek Active glucometer. Results in 5 seconds, requires only 2μL blood sample. Coded strips eliminate test strip coding. Store below 30°C. Valid 6 months after opening. ISO 15197:2013 certified.',
    tags:['glucometer strips','accu-chek','blood glucose','diabetes monitoring','test strips','roche','home testing']
  },
  {
    name:'Diabetic Care Foot Cream 100g',
    price:280, mrp:375, category:'Diabetes',
    manufacturer:'Himalaya', rating:4.5, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.diabetes('DFC'),
    description:'Specialized foot cream for diabetic patients with neuropathy and dry skin. Contains Urea 10%, allantoin, and herbal extracts that deeply moisturize, prevent cracking, and reduce risk of foot ulcers. Apply daily to clean dry feet. Clinically tested — safe for sensitive diabetic skin.',
    tags:['diabetic foot cream','urea cream','neuropathy','foot care','moisturizer','diabetic skin','prevention']
  },

  /* ══════════════════════════════════════════
     HEART & BP — 10 products
  ══════════════════════════════════════════ */
  {
    name:'Amlodipine 5mg',
    price:38, mrp:52, category:'Heart & BP',
    manufacturer:'Cipla', rating:4.7, reviews:2560, stock:true, requiresPrescription:true,
    image: IMG.heart('AML'),
    description:'Amlodipine 5mg is a calcium channel blocker (dihydropyridine class) used to treat hypertension (high blood pressure) and angina (chest pain). Relaxes blood vessels so the heart does not have to work as hard. Once-daily dosing — take at the same time each day. Do not stop abruptly without doctor advice.',
    tags:['amlodipine','calcium channel blocker','hypertension','blood pressure','angina','heart','norvasc']
  },
  {
    name:'Atorvastatin 10mg',
    price:65, mrp:88, category:'Heart & BP',
    manufacturer:'Lupin', rating:4.6, reviews:1980, stock:true, requiresPrescription:true,
    image: IMG.heart('ATV'),
    description:"Atorvastatin 10mg is a statin (HMG-CoA reductase inhibitor) that reduces LDL ('bad') cholesterol and triglycerides while increasing HDL ('good') cholesterol. Taken at night (liver makes most cholesterol at night). Also reduces the risk of heart attack and stroke in high-risk patients. Monitor liver function.",
    tags:['atorvastatin','statin','cholesterol','LDL','lipitor','cardiovascular','heart attack prevention']
  },
  {
    name:'Atorvastatin 20mg',
    price:88, mrp:118, category:'Heart & BP',
    manufacturer:'Torrent', rating:4.6, reviews:1240, stock:true, requiresPrescription:true,
    image: IMG.heart('A20'),
    description:'Atorvastatin 20mg for moderate to high cardiovascular risk patients. Effectively lowers LDL cholesterol by 39-43%. Standard dose for post-heart attack or post-stent patients per ACC/AHA guidelines. Take in the evening. Avoid grapefruit juice. Regular lipid profile monitoring every 3-6 months.',
    tags:['atorvastatin 20mg','statin','post-cardiac','high intensity','cholesterol','LDL','lipitor 20']
  },
  {
    name:'Ramipril 5mg',
    price:45, mrp:62, category:'Heart & BP',
    manufacturer:'Sanofi', rating:4.5, reviews:890, stock:true, requiresPrescription:true,
    image: IMG.heart('RAM'),
    description:'Ramipril 5mg is an ACE inhibitor used for hypertension, heart failure, post-myocardial infarction, and kidney protection in diabetics. Relaxes blood vessels by blocking angiotensin II. Also reduces risk of cardiovascular events in high-risk patients (HOPE trial). Monitor kidney function and potassium.',
    tags:['ramipril','ACE inhibitor','hypertension','heart failure','kidney protection','post-MI','cardiovascular']
  },
  {
    name:'Telmisartan 40mg',
    price:58, mrp:78, category:'Heart & BP',
    manufacturer:'Glenmark', rating:4.6, reviews:1120, stock:true, requiresPrescription:true,
    image: IMG.heart('TEL'),
    description:'Telmisartan 40mg is an ARB (Angiotensin Receptor Blocker) used for hypertension and cardiovascular risk reduction. Unlike ACE inhibitors, does not cause cough. Longest half-life among ARBs (24h) — superior blood pressure control throughout the day. Also provides metabolic benefits (PPAR-γ agonism).',
    tags:['telmisartan','ARB','hypertension','angiotensin','no cough','blood pressure','cardiovascular']
  },
  {
    name:'Losartan 50mg',
    price:42, mrp:58, category:'Heart & BP',
    manufacturer:'Cipla', rating:4.4, reviews:789, stock:true, requiresPrescription:true,
    image: IMG.heart('LOS'),
    description:'Losartan 50mg is an ARB used for hypertension, diabetic nephropathy, and heart failure. Blocks angiotensin II to relax blood vessels and reduce aldosterone. Also slows progression of kidney disease in Type 2 diabetic patients with proteinuria. Avoid potassium supplements unless directed.',
    tags:['losartan','ARB','cozaar','hypertension','diabetic nephropathy','kidney','heart failure']
  },
  {
    name:'Bisoprolol 2.5mg',
    price:35, mrp:48, category:'Heart & BP',
    manufacturer:'Merck', rating:4.5, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.heart('BIS'),
    description:'Bisoprolol 2.5mg is a highly cardioselective beta-blocker used for hypertension, chronic heart failure, angina, and arrhythmias. Reduces heart rate and myocardial oxygen demand. Do not stop abruptly (rebound hypertension/angina risk). Suitable for patients with mild asthma (with caution).',
    tags:['bisoprolol','beta blocker','heart failure','hypertension','angina','arrhythmia','bradycardia']
  },
  {
    name:'Rosuvastatin 10mg (Crestor)',
    price:95, mrp:128, category:'Heart & BP',
    manufacturer:'AstraZeneca', rating:4.7, reviews:1340, stock:true, requiresPrescription:true,
    image: IMG.heart('ROS'),
    description:'Rosuvastatin 10mg (Crestor) is the most potent statin, achieving greater LDL reduction (47-55%) than equivalent doses of other statins. Used for hypercholesterolemia, mixed dyslipidemia, and primary prevention of cardiovascular events. Take in the morning or evening. Avoid excess alcohol.',
    tags:['rosuvastatin','crestor','statin','LDL','potent','cholesterol','cardiovascular prevention']
  },
  {
    name:'Nitroglycerin Sublingual 0.5mg',
    price:65, mrp:90, category:'Heart & BP',
    manufacturer:'USV', rating:4.8, reviews:678, stock:true, requiresPrescription:true,
    image: IMG.heart('NTG'),
    description:'Nitroglycerin 0.5mg sublingual tablet is emergency medication for acute angina attacks. Place under tongue — relieves chest pain within 1-3 minutes by dilating coronary arteries. If pain continues after 3 tablets (15 minutes), call emergency services. Store in original glass bottle, away from heat and light.',
    tags:['nitroglycerin','GTN','angina','chest pain','sublingual','emergency cardiac','nitrate']
  },
  {
    name:'Aspirin 75mg + Atorvastatin 10mg + Ramipril 5mg (Polypill)',
    price:95, mrp:128, category:'Heart & BP',
    manufacturer:'Cadila', rating:4.6, reviews:1890, stock:true, requiresPrescription:true,
    image: IMG.heart('PPL'),
    description:"The Polypill (Aspirin 75mg + Atorvastatin 10mg + Ramipril 5mg) is a combination tablet for secondary prevention of cardiovascular events in post-heart attack or high-risk patients. Once-daily single tablet improves medication adherence by 33%. Recommended by WHO for resource-limited settings.",
    tags:['polypill','aspirin','atorvastatin','ramipril','secondary prevention','heart attack','combination cardiac']
  },

  /* ══════════════════════════════════════════
     VITAMINS & SUPPLEMENTS — 12 products
  ══════════════════════════════════════════ */
  {
    name:'Vitamin D3 60000 IU (Weekly Dose)',
    price:185, mrp:248, category:'Vitamins & Supplements',
    manufacturer:'Abbott', rating:4.9, reviews:5670, stock:true, requiresPrescription:false,
    image: IMG.vitamin('D3'),
    description:'Vitamin D3 60,000 IU soft gel capsules for weekly supplementation. India has >70% prevalence of Vitamin D deficiency. Once-weekly dosing improves compliance versus daily doses. Restores Vitamin D levels in 8-12 weeks. Essential for calcium absorption, bone health, immunity, and mood regulation.',
    tags:['vitamin D3','60000 IU','weekly','supplement','bone health','immunity','cholecalciferol','sunshine vitamin']
  },
  {
    name:'Vitamin B12 500mcg (Methylcobalamin)',
    price:145, mrp:195, category:'Vitamins & Supplements',
    manufacturer:'Neurobion/Merck', rating:4.8, reviews:3890, stock:true, requiresPrescription:false,
    image: IMG.vitamin('B12'),
    description:'Methylcobalamin (active B12) 500mcg tablets for nerve health, red blood cell formation, and DNA synthesis. B12 deficiency is extremely common in vegetarians and elderly Indians. Treats peripheral neuropathy, megaloblastic anemia, and fatigue. Better absorbed than cyanocobalamin.',
    tags:['vitamin B12','methylcobalamin','nerve health','anemia','neuropathy','vegetarian','supplement','energy']
  },
  {
    name:'Multivitamin + Multimineral (Men)',
    price:320, mrp:428, category:'Vitamins & Supplements',
    manufacturer:'Pfizer (Centrum)', rating:4.7, reviews:4320, stock:true, requiresPrescription:false,
    image: IMG.vitamin('MVM'),
    description:"Centrum Men contains 30+ essential vitamins and minerals formulated for men's health. Includes A, B-complex, C, D, E, K, Zinc, Selenium, Magnesium. Supports energy metabolism, heart health, immune function, and muscle function. One tablet daily with breakfast. 30-day supply.",
    tags:['multivitamin','centrum','men health','complete nutrition','daily supplement','vitamins minerals','energy']
  },
  {
    name:'Multivitamin + Multimineral (Women)',
    price:320, mrp:428, category:'Vitamins & Supplements',
    manufacturer:'Pfizer (Centrum)', rating:4.7, reviews:3890, stock:true, requiresPrescription:false,
    image: IMG.vitamin('MVF'),
    description:"Centrum Women contains nutrients tailored for women's health including Iron (women need 2x more), Folic Acid, Calcium, Vitamin D, and antioxidants. Supports energy, bone health, skin health, and reproductive health. One tablet daily. Essential for women of all ages, especially pre-menopausal.",
    tags:['multivitamin women','centrum women','iron','folic acid','calcium','female health','supplement']
  },
  {
    name:'Omega-3 Fish Oil 1000mg',
    price:265, mrp:355, category:'Vitamins & Supplements',
    manufacturer:'Himalaya', rating:4.6, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.vitamin('OM3'),
    description:"Omega-3 Fish Oil 1000mg soft gel containing EPA 180mg + DHA 120mg. Clinically proven to reduce triglycerides, lower inflammation, support heart health, and improve brain function. Take with meals to reduce fishy aftertaste. Certified for heavy metal safety. India's #1 omega-3 supplement. 60 capsules.",
    tags:['omega 3','fish oil','EPA','DHA','triglycerides','heart health','brain','anti-inflammatory','supplement']
  },
  {
    name:'Calcium + Vitamin D3 500mg/250 IU',
    price:145, mrp:195, category:'Vitamins & Supplements',
    manufacturer:'Pfizer', rating:4.7, reviews:3120, stock:true, requiresPrescription:false,
    image: IMG.vitamin('CAL'),
    description:'Calcium Carbonate 500mg + Vitamin D3 250 IU combination for optimal bone health. Vitamin D3 ensures maximum calcium absorption. Prevents osteoporosis in post-menopausal women and elderly. Take twice daily with meals. Essential supplement for lactating women. 60 chewable tablets.',
    tags:['calcium','vitamin D3','bone health','osteoporosis','calcium carbonate','supplement','women','elderly']
  },
  {
    name:'Iron + Folic Acid Tablets',
    price:95, mrp:128, category:'Vitamins & Supplements',
    manufacturer:'Sun Pharma', rating:4.6, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.vitamin('IFA'),
    description:'Ferrous Sulphate 150mg + Folic Acid 1.5mg for treatment and prevention of iron deficiency anemia. Essential during pregnancy, adolescence, and heavy menstrual periods. Take on empty stomach for better absorption (or with Vitamin C). May cause dark stools and constipation — normal side effects.',
    tags:['iron','folic acid','anemia','ferrous sulphate','pregnancy supplement','hemoglobin','IFA','women health']
  },
  {
    name:'Vitamin C 500mg (Chewable)',
    price:185, mrp:248, category:'Vitamins & Supplements',
    manufacturer:'Himalaya', rating:4.7, reviews:1890, stock:true, requiresPrescription:false,
    image: IMG.vitamin('VTC'),
    description:'Vitamin C 500mg chewable tablets (orange flavour) for immune support, antioxidant protection, collagen synthesis, and iron absorption. Chewable format for better compliance. Each tablet provides 833% of daily recommended intake. Good for skin health, wound healing, and reducing cold duration.',
    tags:['vitamin C','ascorbic acid','immunity','antioxidant','chewable','collagen','skin health','cold prevention']
  },
  {
    name:'Zinc 50mg Tablets',
    price:95, mrp:128, category:'Vitamins & Supplements',
    manufacturer:'Cadila', rating:4.5, reviews:1120, stock:true, requiresPrescription:false,
    image: IMG.vitamin('ZNC'),
    description:'Zinc Sulphate 50mg for immune support, wound healing, and skin health. Zinc deficiency is common in India. Essential cofactor for 300+ enzymes. Reduces duration and severity of common cold. Also used for acne treatment, age-related macular degeneration, and taste/smell disorders. Take with food.',
    tags:['zinc','immunity','wound healing','acne','zinc sulphate','supplement','cold','skin']
  },
  {
    name:'Biotin 10000mcg (Hair, Skin & Nails)',
    price:285, mrp:380, category:'Vitamins & Supplements',
    manufacturer:'Himalaya', rating:4.6, reviews:2450, stock:true, requiresPrescription:false,
    image: IMG.vitamin('BIO'),
    description:'Biotin (Vitamin B7) 10,000 mcg high-potency supplement for hair growth, nail strength, and skin health. Reduces hair loss caused by biotin deficiency. Results visible in 3-4 months. Safe for long-term use. Can interfere with certain thyroid and cardiac lab tests — inform your doctor.',
    tags:['biotin','hair growth','nail strength','skin health','B7','hair loss','supplement','beauty vitamin']
  },
  {
    name:'Magnesium 400mg (Glycinate)',
    price:345, mrp:460, category:'Vitamins & Supplements',
    manufacturer:'NOW Foods', rating:4.7, reviews:1340, stock:true, requiresPrescription:false,
    image: IMG.vitamin('MAG'),
    description:'Magnesium Glycinate 400mg — the most bioavailable form of magnesium. Supports muscle function, sleep quality, stress reduction, and bone health. Reduces leg cramps, migraine frequency, and anxiety. Chelated form is gentle on stomach. Take at bedtime for sleep benefits. 60 capsules.',
    tags:['magnesium','magnesium glycinate','sleep','muscle cramps','anxiety','migraine','supplement','relaxation']
  },
  {
    name:'Coenzyme Q10 (CoQ10) 100mg',
    price:485, mrp:648, category:'Vitamins & Supplements',
    manufacturer:'Himalaya', rating:4.7, reviews:890, stock:true, requiresPrescription:false,
    image: IMG.vitamin('Q10'),
    description:'CoQ10 100mg ubiquinone supplement for cellular energy production and antioxidant protection. Essential for patients on statins (which deplete CoQ10). Supports heart health, reduces blood pressure, and combats mitochondrial dysfunction. Take with fatty meal for 3x better absorption.',
    tags:['coq10','coenzyme Q10','ubiquinone','heart health','energy','mitochondria','statin side effects','antioxidant']
  },

  /* ══════════════════════════════════════════
     STOMACH & DIGESTION — 10 products
  ══════════════════════════════════════════ */
  {
    name:'Omeprazole 20mg',
    price:42, mrp:58, category:'Stomach & Digestion',
    manufacturer:'Sun Pharma', rating:4.6, reviews:3120, stock:true, requiresPrescription:false,
    image: IMG.stomach('OMP'),
    description:'Omeprazole 20mg is a proton pump inhibitor (PPI) that reduces stomach acid production by 90%+. Used for GERD, peptic ulcers, Zollinger-Ellison syndrome, and H. pylori eradication. Take 30-60 minutes before breakfast. Short-term use for acid reflux, longer courses for ulcers.',
    tags:['omeprazole','PPI','acid reflux','GERD','heartburn','peptic ulcer','acidity','stomach acid']
  },
  {
    name:'Pantoprazole 40mg',
    price:55, mrp:75, category:'Stomach & Digestion',
    manufacturer:'Cipla', rating:4.5, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.stomach('PNT'),
    description:'Pantoprazole 40mg is a PPI with longer duration of action than omeprazole. Preferred for treating erosive esophagitis, GERD, and reducing NSAID-induced gastric damage. Take 30-60 minutes before meal. Can be used in patients with liver disease (dose adjustment). Available as tablet and injection.',
    tags:['pantoprazole','PPI','GERD','esophagitis','acid reflux','acidity','H.pylori','proton pump']
  },
  {
    name:'Rabeprazole 20mg',
    price:65, mrp:88, category:'Stomach & Digestion',
    manufacturer:'Torrent', rating:4.5, reviews:890, stock:true, requiresPrescription:false,
    image: IMG.stomach('RAB'),
    description:'Rabeprazole 20mg is a PPI with the fastest onset of acid suppression among PPIs. Effective for duodenal ulcers, GERD, and H. pylori triple therapy. Genetic polymorphism of CYP2C19 has less impact on rabeprazole efficacy. Take before meal. Less drug interactions than omeprazole.',
    tags:['rabeprazole','PPI','fast acting','duodenal ulcer','GERD','H.pylori','acid reflux']
  },
  {
    name:'Domperidone 10mg',
    price:28, mrp:38, category:'Stomach & Digestion',
    manufacturer:'Janssen', rating:4.4, reviews:1120, stock:true, requiresPrescription:false,
    image: IMG.stomach('DMP'),
    description:'Domperidone 10mg is a prokinetic anti-nausea drug that accelerates gastric emptying and reduces nausea and vomiting. Used for nausea from chemotherapy, gastroparesis, and functional dyspepsia. Take 15-30 minutes before meals. Also used to stimulate breast milk production in lactating mothers.',
    tags:['domperidone','motilium','nausea','vomiting','gastroparesis','prokinetic','gastric emptying']
  },
  {
    name:'ORS (Oral Rehydration Salts) — Electral',
    price:45, mrp:60, category:'Stomach & Digestion',
    manufacturer:'FDC Limited', rating:4.7, reviews:4560, stock:true, requiresPrescription:false,
    image: IMG.stomach('ORS'),
    description:'Electral ORS sachets — WHO formula for rapid rehydration during diarrhea, vomiting, heat exhaustion, and dehydration. Each sachet dissolved in 1 litre of clean water provides optimal glucose-electrolyte solution. Box of 21 sachets. Essential first aid for gastroenteritis.',
    tags:['ORS','electral','oral rehydration','diarrhea','dehydration','electrolyte','gastroenteritis','WHO formula']
  },
  {
    name:'Ondansetron 4mg (Zofran)',
    price:42, mrp:58, category:'Stomach & Digestion',
    manufacturer:'GSK', rating:4.6, reviews:890, stock:true, requiresPrescription:false,
    image: IMG.stomach('ONS'),
    description:'Ondansetron 4mg is a 5-HT3 antagonist — the gold standard anti-emetic for preventing and treating nausea and vomiting. Highly effective for chemotherapy-induced, post-surgery, and pregnancy-related nausea (morning sickness). Fast-dissolving tablets work within 30 minutes. Safe during first trimester.',
    tags:['ondansetron','zofran','anti-emetic','nausea','vomiting','chemotherapy','morning sickness','5-HT3']
  },
  {
    name:'Loperamide 2mg (Imodium)',
    price:35, mrp:48, category:'Stomach & Digestion',
    manufacturer:'Janssen', rating:4.5, reviews:1230, stock:true, requiresPrescription:false,
    image: IMG.stomach('LOP'),
    description:'Loperamide 2mg (Imodium) is the most effective OTC antidiarrheal drug. Slows intestinal motility and reduces stool frequency within 1-2 hours. For acute diarrhea: 2 tablets initially, then 1 after each loose stool (max 8/day). Not for bloody diarrhea or high fever. Carry when traveling.',
    tags:['loperamide','imodium','diarrhea','loose stools','antidiarrheal','traveller diarrhea','anti-motility']
  },
  {
    name:'Lactulose Syrup 100ml',
    price:85, mrp:115, category:'Stomach & Digestion',
    manufacturer:'Abbott', rating:4.4, reviews:567, stock:true, requiresPrescription:false,
    image: IMG.stomach('LAC'),
    description:'Lactulose Syrup is an osmotic laxative that treats chronic constipation by drawing water into the colon. Safe for long-term use, pregnant women, elderly, and children. Also used in hepatic encephalopathy to reduce ammonia absorption. Results in 24-48 hours. Start with 15-30mL daily.',
    tags:['lactulose','laxative','constipation','osmotic','hepatic encephalopathy','safe','pregnancy']
  },
  {
    name:'Probiotics — Lactobacillus + Bifidobacterium',
    price:285, mrp:380, category:'Stomach & Digestion',
    manufacturer:'Abbott (Bifilac)', rating:4.7, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.stomach('PRB'),
    description:'Multi-strain probiotic containing Lactobacillus and Bifidobacterium (10 billion CFU) for gut health restoration. Prevents antibiotic-associated diarrhea, treats IBS, improves lactose intolerance, and boosts immunity. Take during or after meals. Store in cool dry place. 30 capsules.',
    tags:['probiotic','lactobacillus','bifidobacterium','gut health','IBS','antibiotic diarrhea','microbiome','bifilac']
  },
  {
    name:'Metoclopramide 10mg',
    price:22, mrp:30, category:'Stomach & Digestion',
    manufacturer:'Sun Pharma', rating:4.2, reviews:445, stock:true, requiresPrescription:false,
    image: IMG.stomach('MTC'),
    description:'Metoclopramide 10mg is a prokinetic anti-emetic that speeds up gastric emptying and prevents nausea. Used for diabetic gastroparesis, GERD, nausea from migraines, and post-operative nausea. Take 30 minutes before meals. Short-term use only (max 12 weeks). May cause drowsiness.',
    tags:['metoclopramide','reglan','prokinetic','nausea','gastroparesis','anti-emetic','GERD','stomach emptying']
  },

  /* ══════════════════════════════════════════
     RESPIRATORY — 8 products
  ══════════════════════════════════════════ */
  {
    name:'Salbutamol Inhaler 100mcg (Ventolin)',
    price:185, mrp:248, category:'Respiratory',
    manufacturer:'GSK', rating:4.9, reviews:3450, stock:true, requiresPrescription:true,
    image: IMG.resp('SAL'),
    description:"Salbutamol (Albuterol) 100mcg/dose metered-dose inhaler — India's most prescribed bronchodilator for asthma and COPD. Provides rapid bronchodilation within 5 minutes lasting 4-6 hours. Used as rescue inhaler during acute attacks. 200 doses per inhaler. Use spacer for better lung deposition.",
    tags:['salbutamol','ventolin','albuterol','inhaler','asthma','COPD','bronchodilator','rescue inhaler','MDI']
  },
  {
    name:'Budesonide Inhaler 200mcg (Budecort)',
    price:285, mrp:380, category:'Respiratory',
    manufacturer:'AstraZeneca', rating:4.7, reviews:1890, stock:true, requiresPrescription:true,
    image: IMG.resp('BUD'),
    description:'Budesonide 200mcg inhaled corticosteroid (ICS) for long-term asthma control. Reduces airway inflammation and prevents asthma attacks. Use twice daily — rinse mouth after each use to prevent oral thrush. Not a rescue inhaler. Results seen in 1-2 weeks. 200 doses per inhaler.',
    tags:['budesonide','budecort','inhaled steroid','ICS','asthma controller','preventer inhaler','corticosteroid']
  },
  {
    name:'Montelukast + Levocetirizine (Tablet)',
    price:65, mrp:88, category:'Respiratory',
    manufacturer:'Cipla', rating:4.6, reviews:1560, stock:true, requiresPrescription:true,
    image: IMG.resp('M+L'),
    description:'Fixed-dose combination of Montelukast 10mg + Levocetirizine 5mg for comprehensive management of allergic rhinitis with asthma component. Montelukast controls lower airway inflammation while Levocetirizine addresses upper airway allergy symptoms. Once daily at bedtime. 10-tablet strip.',
    tags:['montelukast levocetirizine','allergic rhinitis','asthma','combination','allergy plus asthma','leukotriene']
  },
  {
    name:'Tiotropium Inhaler 18mcg (Spiriva)',
    price:890, mrp:1180, category:'Respiratory',
    manufacturer:'Boehringer Ingelheim', rating:4.8, reviews:678, stock:true, requiresPrescription:true,
    image: IMG.resp('TIO'),
    description:'Tiotropium 18mcg (Spiriva) is a once-daily long-acting muscarinic antagonist (LAMA) for COPD maintenance. Significantly improves lung function (FEV1), reduces exacerbations, and improves quality of life. Use HandiHaler device — one capsule daily. Not for acute bronchospasm.',
    tags:['tiotropium','spiriva','COPD','LAMA','long acting','bronchodilator','lung function','once daily']
  },
  {
    name:'Levosalbutamol + Ipratropium Nebulization',
    price:145, mrp:195, category:'Respiratory',
    manufacturer:'Cipla', rating:4.7, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.resp('L+I'),
    description:'Levosalbutamol 1.25mg + Ipratropium 0.5mg unit dose vials for nebulization. Dual bronchodilator therapy for acute asthma exacerbations and COPD flares. Beta-2 agonist + anticholinergic combination provides synergistic bronchodilation. 2.5mL vials, box of 5. Hospital and home nebulizer use.',
    tags:['levosalbutamol','ipratropium','nebulizer','COPD exacerbation','asthma acute','dual bronchodilator','hospital']
  },
  {
    name:'Dextromethorphan Cough Syrup (Benylin)',
    price:95, mrp:128, category:'Respiratory',
    manufacturer:'Johnson & Johnson', rating:4.3, reviews:1230, stock:true, requiresPrescription:false,
    image: IMG.resp('DXM'),
    description:'Dextromethorphan 15mg/5mL cough suppressant syrup for dry, irritating, non-productive cough. Acts on the cough center in the brain. Effective for nocturnal cough that disturbs sleep. Adult dose: 10mL every 6-8 hours. Not for productive (wet) cough. Sugar-free formula available. 100mL bottle.',
    tags:['dextromethorphan','benylin','cough suppressant','dry cough','antitussive','non-productive cough','night cough']
  },
  {
    name:'Ambroxol + Guaifenesin Expectorant',
    price:68, mrp:92, category:'Respiratory',
    manufacturer:'Pfizer', rating:4.4, reviews:1890, stock:true, requiresPrescription:false,
    image: IMG.resp('AMB'),
    description:'Ambroxol 15mg + Guaifenesin 50mg per 5mL expectorant syrup (Ascoril LS style) for productive cough. Ambroxol thins mucus + Guaifenesin increases respiratory tract fluid — together help clear chest congestion. Effective for bronchitis, COPD, and wet cough. 100mL bottle with measuring cup.',
    tags:['ambroxol','guaifenesin','expectorant','wet cough','mucus','productive cough','bronchitis','chest congestion']
  },
  {
    name:'Fluticasone Nasal Spray (Flonase)',
    price:245, mrp:328, category:'Respiratory',
    manufacturer:'GSK', rating:4.7, reviews:1340, stock:true, requiresPrescription:false,
    image: IMG.resp('FLN'),
    description:'Fluticasone Propionate 50mcg/spray nasal spray for allergic and non-allergic rhinitis. Reduces nasal inflammation, congestion, runny nose, sneezing, and itching. Full effect seen in 1-2 weeks of regular use. 2 sprays per nostril once daily. 150 doses per bottle. Preferred by ENT specialists.',
    tags:['fluticasone','flonase','nasal spray','rhinitis','nasal congestion','intranasal steroid','allergy nose','sneezing']
  },

  /* ══════════════════════════════════════════
     SKIN CARE — 8 products
  ══════════════════════════════════════════ */
  {
    name:'Betadine Solution 100mL',
    price:65, mrp:88, category:'Skin Care',
    manufacturer:'Win-Medicare', rating:4.7, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.skin('BTD'),
    description:"Betadine (Povidone-Iodine 10%) antiseptic solution for disinfecting wounds, cuts, burns, and surgical sites. Broad-spectrum activity against bacteria, viruses, fungi, and spores. Apply with gauze or cotton, do not cover immediately. India's #1 trusted antiseptic. 100mL amber bottle.",
    tags:['betadine','povidone iodine','antiseptic','wound care','disinfectant','cuts','burns','surgical prep']
  },
  {
    name:'Hydrocortisone Cream 1%',
    price:78, mrp:105, category:'Skin Care',
    manufacturer:'Abbott', rating:4.4, reviews:1120, stock:true, requiresPrescription:false,
    image: IMG.skin('HYD'),
    description:'Hydrocortisone 1% cream for mild inflammatory skin conditions including eczema, contact dermatitis, insect bites, nappy rash, and heat rash. Apply thin layer to affected area 1-2x daily. Do not apply to face for more than 7 days. Avoid eyelids and open wounds. Not for acne or rosacea.',
    tags:['hydrocortisone','steroid cream','eczema','dermatitis','rash','itching','topical corticosteroid','skin inflammation']
  },
  {
    name:'Clotrimazole 1% Cream (Canesten)',
    price:52, mrp:72, category:'Skin Care',
    manufacturer:'Bayer', rating:4.6, reviews:1890, stock:true, requiresPrescription:false,
    image: IMG.skin('CLO'),
    description:'Clotrimazole 1% antifungal cream for ringworm (tinea corporis), athlete\'s foot (tinea pedis), jock itch (tinea cruris), and candidal skin infections. Apply twice daily to clean dry skin. Continue for 4 weeks even if symptoms clear. 20g tube.',
    tags:['clotrimazole','canesten','antifungal','ringworm','athletes foot','jock itch','candida','tinea','fungal infection']
  },
  {
    name:'Tretinoin 0.025% Cream',
    price:145, mrp:195, category:'Skin Care',
    manufacturer:'Cipla', rating:4.5, reviews:890, stock:true, requiresPrescription:true,
    image: IMG.skin('TRE'),
    description:'Tretinoin (Retin-A) 0.025% cream — the gold standard for acne treatment and anti-aging. Accelerates skin cell turnover, unclogs pores, reduces comedones, and stimulates collagen production. Apply at night to dry skin. Use SPF 30+ daily (increases photosensitivity). Initial 4-6 week purging phase is normal.',
    tags:['tretinoin','retin-A','retinoid','acne','anti-aging','wrinkles','collagen','pore','night cream']
  },
  {
    name:'Mupirocin 2% Ointment (Bactroban)',
    price:115, mrp:155, category:'Skin Care',
    manufacturer:'GSK', rating:4.6, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.skin('MUP'),
    description:'Mupirocin 2% (Bactroban) topical antibiotic for bacterial skin infections including impetigo, folliculitis, infected wounds, and MRSA nasal decolonization. Apply 3x daily for 7-10 days. Effective against Staphylococcus aureus including MRSA. 5g and 15g tubes available.',
    tags:['mupirocin','bactroban','topical antibiotic','impetigo','folliculitis','MRSA','staphylococcus','skin infection']
  },
  {
    name:'Sunscreen SPF 50+ PA+++ 75g',
    price:285, mrp:380, category:'Skin Care',
    manufacturer:'La Shield (Glenmark)', rating:4.8, reviews:4560, stock:true, requiresPrescription:false,
    image: IMG.skin('SUN'),
    description:"La Shield SPF 50+ PA+++ broad-spectrum sunscreen protecting against UVA (aging) and UVB (burning) radiation. Non-greasy, non-comedogenic formula suitable for Indian skin tones and oily/combination skin. Dermatologist-tested. Apply 30 minutes before sun exposure. Reapply every 2-3 hours. India's top dermatologist-recommended sunscreen.",
    tags:['sunscreen','SPF 50','PA+++','UVA UVB','broad spectrum','non-comedogenic','la shield','dermatologist','photoproection']
  },
  {
    name:'Adapalene 0.1% + Benzoyl Peroxide 2.5%',
    price:195, mrp:260, category:'Skin Care',
    manufacturer:'Galderma', rating:4.6, reviews:1120, stock:true, requiresPrescription:true,
    image: IMG.skin('ADP'),
    description:'Epiduo-type combination gel: Adapalene 0.1% (retinoid) + Benzoyl Peroxide 2.5% for moderate acne vulgaris. Dual mechanism: Adapalene reduces comedone formation + Benzoyl Peroxide kills P. acnes bacteria. Apply once daily at night to entire face (not just spots). Use SPF daily.',
    tags:['adapalene','benzoyl peroxide','acne','combination acne treatment','retinoid','antibacterial','pimples','comedone']
  },
  {
    name:'Calamine Lotion 100mL',
    price:52, mrp:70, category:'Skin Care',
    manufacturer:'Piramal', rating:4.5, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.skin('CAL'),
    description:'Calamine Lotion (Calamine 15% + Zinc Oxide 5%) is India\'s trusted soothing lotion for rashes, eczema, chickenpox, sunburn, heat rash, insect bites, and contact dermatitis. Anti-pruritic and astringent — provides instant cooling relief. Apply with cotton, allow to dry. Shake before use.',
    tags:['calamine','zinc oxide','rash','itching','eczema','chickenpox','sunburn','heat rash','insect bite','soothing']
  },

  /* ══════════════════════════════════════════
     EYE CARE — 5 products
  ══════════════════════════════════════════ */
  {
    name:'Ciprofloxacin Eye Drops 0.3%',
    price:45, mrp:62, category:'Eye Care',
    manufacturer:'Sun Pharma', rating:4.5, reviews:890, stock:true, requiresPrescription:true,
    image: IMG.eye('CEY'),
    description:'Ciprofloxacin 0.3% ophthalmic solution (eye drops) for bacterial conjunctivitis, corneal ulcers, and other external ocular infections. Instill 1-2 drops in affected eye(s) every 2 hours while awake for 2 days, then every 4 hours for 5 more days. Do not touch dropper tip to eye. 5mL bottle.',
    tags:['ciprofloxacin eye drops','bacterial conjunctivitis','eye infection','pink eye','corneal ulcer','ophthalmic']
  },
  {
    name:'Carboxymethylcellulose Eye Drops (Refresh Tears)',
    price:95, mrp:128, category:'Eye Care',
    manufacturer:'Allergan', rating:4.8, reviews:3450, stock:true, requiresPrescription:false,
    image: IMG.eye('REF'),
    description:'Carboxymethylcellulose 0.5% (Refresh Tears) lubricating eye drops for dry eye syndrome caused by screens, AC, contact lenses, and environmental factors. Provides instant and lasting moisture. Preservative-free formula safe for long-term use. Can be used with contact lenses. 10mL bottle.',
    tags:['dry eye','eye drops','lubricant','CMC','refresh tears','screen eyes','contact lens','artificial tears']
  },
  {
    name:'Timolol 0.5% Eye Drops (Glaucoma)',
    price:85, mrp:115, category:'Eye Care',
    manufacturer:'Cipla', rating:4.6, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.eye('TIM'),
    description:'Timolol Maleate 0.5% ophthalmic solution for lowering intraocular pressure (IOP) in open-angle glaucoma and ocular hypertension. Non-selective beta-blocker reduces aqueous humor production. Instill 1 drop in affected eye(s) twice daily. Regular IOP monitoring required. 5mL bottle.',
    tags:['timolol','glaucoma','intraocular pressure','IOP','eye drops','beta blocker','ophthalmic','ocular hypertension']
  },
  {
    name:'Tobramycin + Dexamethasone Eye Drops',
    price:125, mrp:168, category:'Eye Care',
    manufacturer:'Alcon', rating:4.4, reviews:345, stock:true, requiresPrescription:true,
    image: IMG.eye('T+D'),
    description:'Tobramycin 0.3% + Dexamethasone 0.1% combination eye drops for bacterial eye infections with significant inflammation. Antibiotic controls bacterial infection while steroid reduces inflammatory response. Post-surgical use common. 1-2 drops 4-6x daily. Do not use for viral or fungal eye infections.',
    tags:['tobramycin dexamethasone','antibiotic steroid eye drops','post-surgery eye','eye infection inflammation','ophthalmic combination']
  },
  {
    name:'Vitamin A Eye Ointment (Refresh PM)',
    price:145, mrp:195, category:'Eye Care',
    manufacturer:'Allergan', rating:4.7, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.eye('VIT'),
    description:'Lubricating eye ointment with Vitamin A for severe dry eye, nocturnal lagophthalmos, and eye surface protection. Thicker consistency than drops — use at bedtime for overnight moisture. Temporarily blurs vision after application. 3.5g tube lasts 1-2 months.',
    tags:['vitamin A eye ointment','severe dry eye','lubricating ointment','night eye care','lagophthalmos','eye protection']
  },

  /* ══════════════════════════════════════════
     BABY CARE — 8 products
  ══════════════════════════════════════════ */
  {
    name:'Paracetamol Syrup for Children 125mg/5mL',
    price:52, mrp:70, category:'Baby Care',
    manufacturer:'Cipla', rating:4.8, reviews:5670, stock:true, requiresPrescription:false,
    image: IMG.baby('PCS'),
    description:"Paracetamol 125mg/5mL strawberry-flavored syrup for fever and pain in children from 3 months to 12 years. Dosage: 15mg/kg every 4-6 hours. Does not cause aspirin-related Reye's syndrome. Sugar-free formula for diabetic children. Comes with calibrated dosing spoon. 60mL and 100mL bottles.",
    tags:['paracetamol syrup','baby fever','children fever','pediatric paracetamol','infant fever','safe children','calpol']
  },
  {
    name:'Ibuprofen Syrup 100mg/5mL',
    price:68, mrp:92, category:'Baby Care',
    manufacturer:'Abbott', rating:4.7, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.baby('IBS'),
    description:'Ibuprofen 100mg/5mL suspension for children from 6 months and above. Effective for teething pain, post-vaccination fever, earache, and high fever unresponsive to paracetamol. Dose: 5-10mg/kg every 6-8 hours. Alternate with paracetamol for higher fevers. Do not use if vomiting or dehydrated.',
    tags:['ibuprofen syrup','baby pain','children ibuprofen','teething','post-vaccine fever','pediatric NSAID','nurofen kids']
  },
  {
    name:'ORS for Infants — Pedialyte',
    price:95, mrp:128, category:'Baby Care',
    manufacturer:'Abbott', rating:4.9, reviews:3450, stock:true, requiresPrescription:false,
    image: IMG.baby('PED'),
    description:'Pedialyte oral electrolyte solution specifically formulated for infants and toddlers with diarrhea and vomiting. Contains the right balance of electrolytes and glucose. Does not contain artificial flavors or colors. Ready-to-use 1-litre bottle and 200mL tetra pack. Preferred by pediatricians.',
    tags:['pedialyte','ORS infant','baby dehydration','infant diarrhea','oral electrolyte','baby vomiting','pediatric rehydration']
  },
  {
    name:'Zinc Syrup 10mg/5mL (Baby)',
    price:65, mrp:88, category:'Baby Care',
    manufacturer:'Cipla', rating:4.7, reviews:2120, stock:true, requiresPrescription:false,
    image: IMG.baby('ZNB'),
    description:'Zinc sulphate syrup 10mg/5mL for children as adjunct treatment for diarrhea (per WHO recommendations) and zinc deficiency. Reduces diarrhea duration and severity. Dose for children: 10mg/day under 6 months, 20mg/day for 6 months - 5 years. Give for 14 days during diarrhea episode.',
    tags:['zinc syrup','baby zinc','infant diarrhea','WHO zinc','pediatric zinc','diarrhea treatment','zinc supplement baby']
  },
  {
    name:'Diaper Rash Cream — Sudocrem 125g',
    price:285, mrp:380, category:'Baby Care',
    manufacturer:'Forest Laboratories', rating:4.9, reviews:6780, stock:true, requiresPrescription:false,
    image: IMG.baby('SUD'),
    description:"Sudocrem antiseptic healing cream contains Zinc Oxide 15.25%, benzyl alcohol, lanolin for diaper rash treatment and prevention. Forms a protective barrier against moisture and irritants. Also heals eczema, cuts, minor burns, and sunburn. Fragrance-free, safe for newborns. India's #1 baby rash cream. 125g tub.",
    tags:['sudocrem','diaper rash','nappy rash','zinc oxide','baby skin','rash cream','neonatal','protective barrier','eczema baby']
  },
  {
    name:'Gripe Water (Woodward\'s)',
    price:85, mrp:115, category:'Baby Care',
    manufacturer:'GlaxoSmithKline', rating:4.6, reviews:8900, stock:true, requiresPrescription:false,
    image: IMG.baby('GRP'),
    description:"Woodward's Gripe Water contains dill oil, ginger, and fennel seed oil for colic, gas, and digestive discomfort in infants from 1 month. Provides fast relief from crying due to trapped gas and stomach cramps. Alcohol-free formula. 150mL bottle. India's most trusted baby remedy for over 100 years.",
    tags:['gripe water','woodwards','baby colic','infant gas','stomach cramp','dill oil','ginger','fennel','baby digestive','trapped wind']
  },
  {
    name:'Baby Nasal Saline Drops',
    price:95, mrp:128, category:'Baby Care',
    manufacturer:'Cipla', rating:4.7, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.baby('NSL'),
    description:'Isotonic saline nasal drops (0.9% NaCl) for clearing nasal congestion in infants and children. Drug-free solution — safe from birth. 2-3 drops per nostril to loosen mucus before feeding or sleeping. Use with nasal aspirator for blocked noses. 10mL and 15mL bottles. Preservative-free.',
    tags:['baby saline drops','infant nasal congestion','baby blocked nose','saline nasal','newborn cold','nasal drops baby']
  },
  {
    name:'Vitamin D3 Drops — 400 IU (Infant)',
    price:145, mrp:195, category:'Baby Care',
    manufacturer:'Abbott (D-Drops)', rating:4.9, reviews:4560, stock:true, requiresPrescription:false,
    image: IMG.baby('VDD'),
    description:"Vitamin D3 400 IU liquid drops for exclusively breastfed infants from day 1. Breast milk alone is insufficient in Vitamin D — supplementation prevents rickets and supports bone development. One drop (400 IU) per day added to breast milk or formula. Pure coconut oil base, no preservatives. India's pediatrician #1 choice.",
    tags:['vitamin D infant','baby vitamin D','D-drops','rickets prevention','breastfed baby supplement','infant vitamin D','newborn supplement']
  },

  /* ══════════════════════════════════════════
     WOMEN'S HEALTH — 6 products
  ══════════════════════════════════════════ */
  {
    name:'Folic Acid 5mg (Pre-Natal)',
    price:45, mrp:62, category:'Women\'s Health',
    manufacturer:'Sun Pharma', rating:4.9, reviews:6780, stock:true, requiresPrescription:false,
    image: IMG.women('FOL'),
    description:'Folic Acid 5mg is essential in early pregnancy (first 12 weeks) to prevent neural tube defects including spina bifida in the baby. Begin 3 months before conception. Also reduces risk of cleft palate and heart defects. Prescribed by all gynecologists as prenatal supplement.',
    tags:['folic acid','pregnancy supplement','neural tube defect','prenatal vitamin','conception','first trimester','spina bifida prevention']
  },
  {
    name:'Iron Sucrose Injection 100mg/5mL',
    price:285, mrp:380, category:'Women\'s Health',
    manufacturer:'Emcure', rating:4.7, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.women('IVI'),
    description:'Iron Sucrose IV Injection for severe iron deficiency anemia in pregnancy, post-partum anemia, and when oral iron cannot be tolerated. Administered intravenously — requires hospital/clinic setting. Each 5mL vial contains 100mg elemental iron. Immediate hemoglobin improvement. Monitor for allergic reactions.',
    tags:['iron sucrose','IV iron','severe anemia','pregnancy anemia','intravenous iron','hemoglobin','post-partum']
  },
  {
    name:'Norethisterone 5mg (Period Delay)',
    price:95, mrp:128, category:'Women\'s Health',
    manufacturer:'Schering', rating:4.3, reviews:1120, stock:true, requiresPrescription:false,
    image: IMG.women('NOR'),
    description:"Norethisterone 5mg (synthetic progesterone) for postponing menstruation for important occasions, travel, or medical reasons. Start 3 days before expected period — period comes 2-3 days after stopping. Not a contraceptive. Short-term use only. Not for women with clotting disorders or migraines with aura.",
    tags:['norethisterone','period delay','postpone period','progesterone','menstruation control','primolut','period pill']
  },
  {
    name:'Emergency Contraceptive Pill (I-Pill)',
    price:85, mrp:115, category:'Women\'s Health',
    manufacturer:'Cipla', rating:4.1, reviews:3450, stock:true, requiresPrescription:false,
    image: IMG.women('ECP'),
    description:"i-Pill (Levonorgestrel 1.5mg) emergency contraceptive tablet — up to 95% effective if taken within 24 hours of unprotected sex (72-hour window). Single tablet. Not for regular contraception. May cause nausea, irregular periods. Does not protect against STIs. Not for use if already pregnant.",
    tags:['i-pill','emergency contraceptive','morning after pill','levonorgestrel','unwanted pregnancy','EC pill','72 hours']
  },
  {
    name:'Tranexamic Acid 500mg (Heavy Periods)',
    price:68, mrp:92, category:'Women\'s Health',
    manufacturer:'Cipla', rating:4.6, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.women('TXA'),
    description:'Tranexamic Acid 500mg is an antifibrinolytic agent that reduces heavy menstrual bleeding (menorrhagia) by 50-60%. Take 3-4 tablets three times daily during heavy flow days only. Also used post-surgery and dental extractions to reduce bleeding. Not a hormonal drug.',
    tags:['tranexamic acid','heavy periods','menorrhagia','heavy bleeding','antifibrinolytic','period bleeding','cyklokapron']
  },
  {
    name:'Prenatal Multivitamin (Pregnacare)',
    price:485, mrp:648, category:'Women\'s Health',
    manufacturer:'Vitabiotics', rating:4.9, reviews:4560, stock:true, requiresPrescription:false,
    image: IMG.women('PRG'),
    description:"Pregnacare Original — the UK's leading prenatal supplement, now available in India. Contains Folic Acid 400mcg, Iron 17mg, Calcium, Vitamin D3, Iodine, B-complex, DHA, and 19 other essential nutrients for healthy pregnancy. One tablet daily throughout pregnancy and breastfeeding. 30-tablet pack.",
    tags:['pregnacare','prenatal vitamin','pregnancy supplement','folic acid','iron pregnancy','DHA','complete prenatal','trimester vitamins']
  },

  /* ══════════════════════════════════════════
     NEUROLOGY / MENTAL HEALTH — 6 products
  ══════════════════════════════════════════ */
  {
    name:'Alprazolam 0.25mg',
    price:35, mrp:48, category:'Neurology',
    manufacturer:'Pfizer', rating:4.0, reviews:678, stock:true, requiresPrescription:true,
    image: IMG.neuro('ALP'),
    description:'Alprazolam 0.25mg is a benzodiazepine used for short-term treatment of anxiety disorders and panic disorder. Also helps with anticipatory anxiety before stressful events. Habit-forming — use for maximum 2-4 weeks. Do not drive. Avoid alcohol. Do not stop abruptly. Prescription mandatory in India.',
    tags:['alprazolam','xanax','anxiety','benzodiazepine','panic disorder','short-term anxiety','controlled substance']
  },
  {
    name:'Sertraline 50mg (Zoloft)',
    price:85, mrp:115, category:'Neurology',
    manufacturer:'Pfizer', rating:4.4, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.neuro('SER'),
    description:'Sertraline 50mg (Zoloft) is the most prescribed SSRI antidepressant worldwide. Used for depression, OCD, PTSD, social anxiety disorder, and panic disorder. Full effect in 4-6 weeks. Start low. Do not stop abruptly. May cause initial nausea, insomnia. Very low drug interaction profile. Prescription required.',
    tags:['sertraline','zoloft','SSRI','antidepressant','depression','OCD','anxiety disorder','mental health']
  },
  {
    name:'Melatonin 5mg (Sleep Aid)',
    price:145, mrp:195, category:'Neurology',
    manufacturer:'Himalaya', rating:4.6, reviews:2340, stock:true, requiresPrescription:false,
    image: IMG.neuro('MEL'),
    description:"Melatonin 5mg tablet for insomnia, jet lag, and shift work sleep disorder. Melatonin is the body's natural sleep hormone — supplementation shifts the sleep-wake cycle. Take 30-60 minutes before target bedtime. Non-habit forming. Suitable for short-term use. Safe alternative to sleeping pills.",
    tags:['melatonin','sleep aid','insomnia','jet lag','sleep hormone','shift work','non-habit forming','natural sleep']
  },
  {
    name:'Pregabalin 75mg (Lyrica)',
    price:145, mrp:195, category:'Neurology',
    manufacturer:'Pfizer', rating:4.3, reviews:456, stock:true, requiresPrescription:true,
    image: IMG.neuro('PRG'),
    description:'Pregabalin 75mg (Lyrica) for neuropathic pain (diabetic neuropathy, postherpetic neuralgia), fibromyalgia, and epilepsy as adjunctive therapy. Also reduces anxiety in GAD. May cause dizziness and somnolence — start low. Controlled substance in India — prescription mandatory. Gradual dose tapering on discontinuation.',
    tags:['pregabalin','lyrica','neuropathic pain','diabetic neuropathy','fibromyalgia','epilepsy','nerve pain','gabapentinoid']
  },
  {
    name:'Gabapentin 300mg',
    price:58, mrp:78, category:'Neurology',
    manufacturer:'Pfizer', rating:4.2, reviews:378, stock:true, requiresPrescription:true,
    image: IMG.neuro('GAB'),
    description:'Gabapentin 300mg for epilepsy (adjunct therapy) and neuropathic pain conditions including postherpetic neuralgia. Also widely used off-label for anxiety, restless leg syndrome, and alcohol withdrawal. Take with or without food — consistent timing important. Causes dizziness, drowsiness.',
    tags:['gabapentin','neurontin','epilepsy','neuropathic pain','nerve pain','postherpetic neuralgia','anticonvulsant']
  },
  {
    name:'Sumatriptan 50mg (Imigran) — Migraine',
    price:185, mrp:248, category:'Neurology',
    manufacturer:'GSK', rating:4.7, reviews:890, stock:true, requiresPrescription:true,
    image: IMG.neuro('SUM'),
    description:'Sumatriptan 50mg (Imigran) is a selective serotonin (5-HT1) agonist — the most effective acute migraine treatment. Aborts migraine attacks within 2 hours in 70% of patients. Take at onset of headache phase. Do not take for hemiplegic or basilar migraine. Not a preventive drug — for acute attacks only.',
    tags:['sumatriptan','imigran','migraine','triptan','acute migraine','serotonin agonist','headache treatment','5-HT1']
  },

  /* ══════════════════════════════════════════
     LIVER CARE — 4 products
  ══════════════════════════════════════════ */
  {
    name:'Silymarin 140mg (Milk Thistle — Liv 52)',
    price:185, mrp:248, category:'Liver Care',
    manufacturer:'Himalaya', rating:4.7, reviews:3450, stock:true, requiresPrescription:false,
    image: IMG.liver('LIV'),
    description:"Liv.52 DS contains Silymarin (Milk Thistle), Capers, Chicory, and Mandur bhasma — Himalaya's bestselling liver tonic. Protects liver cells from damage caused by alcohol, medications, hepatitis, and toxins. Increases appetite, promotes liver cell regeneration. India's #1 liver supplement for 60+ years.",
    tags:['liv52','silymarin','milk thistle','liver tonic','hepatoprotective','liver health','alcohol liver','himalaya','hepatitis']
  },
  {
    name:'Ursodeoxycholic Acid 300mg (UDCA)',
    price:145, mrp:195, category:'Liver Care',
    manufacturer:'Cipla', rating:4.5, reviews:456, stock:true, requiresPrescription:true,
    image: IMG.liver('URS'),
    description:'UDCA 300mg is a bile acid for primary biliary cholangitis, intrahepatic cholestasis of pregnancy (ICP), and non-alcoholic fatty liver disease (NAFLD). Reduces bile toxicity to liver cells. Dose for ICP: 10-15mg/kg/day. Take with meals. Regular liver function tests required.',
    tags:['UDCA','ursodeoxycholic acid','bile acid','biliary cholangitis','ICP pregnancy','NAFLD','fatty liver','liver disease']
  },
  {
    name:'N-Acetyl Cysteine 600mg (NAC)',
    price:245, mrp:328, category:'Liver Care',
    manufacturer:'Cipla', rating:4.6, reviews:678, stock:true, requiresPrescription:false,
    image: IMG.liver('NAC'),
    description:'N-Acetyl Cysteine 600mg (NAC) replenishes glutathione — the liver\'s master antioxidant. Used for paracetamol overdose (IV), NAFLD, and as mucolytic for respiratory mucus. Also shows benefits for OCD, PCOS, and lung conditions. Effervescent tablet or capsule. Antioxidant + liver protector.',
    tags:['NAC','N-acetyl cysteine','glutathione','liver antioxidant','NAFLD','paracetamol overdose','mucolytic','liver protection']
  },
  {
    name:'Ademetionine 400mg (SAMe)',
    price:585, mrp:780, category:'Liver Care',
    manufacturer:'Abbott', rating:4.4, reviews:289, stock:true, requiresPrescription:true,
    image: IMG.liver('SAM'),
    description:'Ademetionine (SAMe) 400mg for intrahepatic cholestasis, alcoholic liver disease, and depression. Methyl donor that participates in liver detoxification pathways. Also shown to improve mood (adjunct antidepressant). Enteric-coated tablet — take 30 minutes before meals. Prescription required in India.',
    tags:['ademetionine','SAMe','liver cholestasis','alcoholic liver','liver methyl donor','depression adjunct','liver detox']
  },

  /* ══════════════════════════════════════════
     FIRST AID — 5 products
  ══════════════════════════════════════════ */
  {
    name:'Silver Sulfadiazine 1% Cream (Burns)',
    price:85, mrp:115, category:'First Aid',
    manufacturer:'Cipla', rating:4.6, reviews:678, stock:true, requiresPrescription:true,
    image: IMG.firstaid('SSD'),
    description:'Silver Sulfadiazine 1% cream is the standard topical treatment for second and third-degree burns and extensive wounds. Prevents infection by targeting gram-positive and gram-negative bacteria. Apply thin layer daily after wound cleaning under sterile conditions. Do not use on face or in newborns.',
    tags:['silver sulfadiazine','burn cream','burn treatment','wound infection','SSD','thermal burn','dermazine']
  },
  {
    name:'Elastic Adhesive Bandage 10cm x 4m',
    price:145, mrp:195, category:'First Aid',
    manufacturer:'Leukoplast (BSN Medical)', rating:4.7, reviews:1230, stock:true, requiresPrescription:false,
    image: IMG.firstaid('EAB'),
    description:'Elastic adhesive bandage (crepe bandage with adhesive backing) for sprains, strains, joint support, and wound coverage. Provides firm compression while allowing mobility. Water-resistant. Self-sticking — no clips needed. Suitable for ankle, knee, wrist, and elbow support. Single roll.',
    tags:['elastic bandage','crepe bandage','sprain','strain support','compression','joint support','sports injury','first aid']
  },
  {
    name:'Antiseptic Cream — Soframycin',
    price:52, mrp:70, category:'First Aid',
    manufacturer:'Sanofi', rating:4.5, reviews:2890, stock:true, requiresPrescription:false,
    image: IMG.firstaid('SOF'),
    description:"Soframycin cream contains Framycetin Sulphate (Neomycin group antibiotic) for minor skin infections, cuts, abrasions, and infected wounds. Prevents bacterial contamination of superficial wounds. Apply 1-3x daily. Do not use on large areas or deep wounds. India's most used topical antibiotic cream. 20g tube.",
    tags:['soframycin','framycetin','antiseptic cream','topical antibiotic','wound cream','cut treatment','abrasion','infection prevention']
  },
  {
    name:'Paracetamol Injection 1g/100mL',
    price:125, mrp:168, category:'First Aid',
    manufacturer:'Fresenius Kabi', rating:4.8, reviews:567, stock:true, requiresPrescription:true,
    image: IMG.firstaid('PIV'),
    description:'Paracetamol 1g IV infusion (100mL) for post-operative pain, fever management in hospitalized patients, and when oral administration is not possible. Infuse over 15 minutes. Faster onset than oral. Dose: 1g every 4-6 hours, max 4g/day. Reduce dose in hepatic impairment.',
    tags:['paracetamol injection','IV paracetamol','post-operative fever','hospital analgesic','intravenous analgesic','IV antipyretic']
  },
  {
    name:'Digital Thermometer',
    price:95, mrp:128, category:'First Aid',
    manufacturer:'Omron', rating:4.8, reviews:12450, stock:true, requiresPrescription:false,
    image: IMG.firstaid('THR'),
    description:"Omron digital thermometer with fast 10-second reading. Accurate to ±0.1°C. Flexible tip for comfort. Fever indicator beep. Memory for last reading. Dual Celsius/Fahrenheit display. Waterproof for easy cleaning. Includes case and battery. India's #1 selling clinical thermometer. Suitable for all ages.",
    tags:['thermometer','digital thermometer','fever','temperature','omron','clinical thermometer','fever check','home medical device']
  },

];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('[OK] Connected to MongoDB');

  // Create admin user
  const adminExists = await User.findOne({ email: 'admin@medplus.com' });
  if (!adminExists) {
    await User.create({
      name: 'MedPlus Admin',
      email: 'admin@medplus.com',
      password: 'Admin@123',
      phone: '9999999999',
      isAdmin: true
    });
    console.log('[OK] Admin created → admin@medplus.com / Admin@123');
  } else {
    console.log('[INFO] Admin already exists');
  }

  // Seed products
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`[OK] ${products.length} products seeded across 14 categories`);

  const cats = [...new Set(products.map(p => p.category))];
  console.log('[OK] Categories:', cats.join(', '));

  await mongoose.disconnect();
  console.log('[DONE] Database seeding complete!');
  console.log('');
  console.log('Run `npm run dev` in backend/ to start the server.');
}

seed().catch(err => { console.error('[ERROR]', err); process.exit(1); });
