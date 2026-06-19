// =====================================================================
// Male Skincare Rebrand Validator — Google Apps Script Backend V1.0
// Deploy as: Execute as Me / Who has access: Anyone
// =====================================================================

var APP_NAME = 'Male Skincare Rebrand Validator';
var APP_VERSION = 'V1.0';
var SHEET_RESPONSES = 'RESPONSES';
var SHEET_ANALYTICS = 'ANALYTICS_CACHE';
var SHEET_SETTINGS  = 'SETTINGS';

var RESPONSE_HEADERS = [
  'responseId','submittedAt','userAgent',
  'utm_source','utm_medium','utm_campaign',
  'respondent_ageRange','respondent_location',
  'q1_usageFrequency','q2_productsUsed','q3_buyer',
  'q4_spendPast6Months','q5_primaryReason','q5_other',
  'q6_brandAwareness','q7_logoWords',
  'q8_packagingChoice','q8_packagingWhy',
  'q9_brandFitScore','q10_tryLikelihood',
  'q11_confidenceDriver','q12_productNameChoice','q12_productNameWhy',
  'q13_oneProductChoice','q14_maxPrice',
  'q15_channelRank1','q15_channelRank2','q15_channelRank3',
  'q16_tiktokTrustContent','q17_watsonsShelfIntent',
  'q18_taglineChoice','q18_taglineWhy',
  'q19_rebrandFeeling','q19_rebrandWhy',
  'q20_friendTrialIntent','optional_barrier',
  'computed_skincareReadinessScore','computed_brandRelevanceScore',
  'computed_productTrialIntentScore','computed_priceAcceptanceScore',
  'computed_channelFitScore','computed_rebrandValidationScore',
  'computed_segmentTags'
];

// =====================================================================
// ENTRY POINTS
// =====================================================================

function doGet(e) {
  try {
    ensureSheets_();
    var action = (e && e.parameter && e.parameter.action) || '';
    var result;

    if (action === 'ping') {
      result = { ok: true, app: APP_NAME, version: APP_VERSION };

    } else if (action === 'getAnalytics') {
      var pin = String((e.parameter && e.parameter.pin) || '');
      var storedPin = String(getSetting_('adminPin') || '2468');
      if (pin !== storedPin) {
        result = { ok: false, error: 'Invalid admin PIN' };
      } else {
        result = getAnalytics_();
      }

    } else if (action === 'getSettings') {
      result = {
        ok: true,
        appVersion: getSetting_('appVersion') || APP_VERSION,
        sheetLink: getSetting_('sheetLink') || ''
      };

    } else {
      result = { ok: false, error: 'Unknown action. Valid: ping | getAnalytics&pin=XXXX | getSettings' };
    }

    var cb = e && e.parameter && e.parameter.callback;
    if (cb) {
      return ContentService
        .createTextOutput(cb + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return json_(result);

  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    var body = JSON.parse(e.postData.contents);
    var action = body.action || 'submitResponse';
    if (action === 'submitResponse') {
      return json_(submitResponse_(body));
    }
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

// =====================================================================
// RESPONSE SUBMISSION
// =====================================================================

function submitResponse_(data) {
  var responseId  = uniqueId_();
  var submittedAt = new Date().toISOString();

  var beScores   = computeScores_(data);
  var beSegments = computeSegments_(data);

  // Log if frontend and backend scores diverge by more than 5 points
  var scoreKeys = [
    'computed_skincareReadinessScore','computed_brandRelevanceScore',
    'computed_productTrialIntentScore','computed_priceAcceptanceScore',
    'computed_channelFitScore','computed_rebrandValidationScore'
  ];
  var mismatch = false;
  scoreKeys.forEach(function(k) {
    var fe = Number(data[k] || 0);
    var be = Number(beScores[k] || 0);
    if (Math.abs(fe - be) > 5) {
      mismatch = true;
      Logger.log('SCORE_MISMATCH ' + k + ': FE=' + fe + ' BE=' + be + ' responseId=' + responseId);
    }
  });

  var row = RESPONSE_HEADERS.map(function(h) {
    if (h === 'responseId')  return responseId;
    if (h === 'submittedAt') return submittedAt;
    if (h === 'userAgent')   return data.userAgent || '';
    if (h === 'computed_segmentTags') return beSegments;
    if (h.startsWith('computed_'))   return beScores[h] !== undefined ? beScores[h] : (data[h] !== undefined ? data[h] : '');
    var val = data[h];
    if (Array.isArray(val)) return val.join(', ');
    return (val !== undefined && val !== null) ? String(val) : '';
  });

  appendResponse_(row);
  return { ok: true, responseId: responseId, message: 'Response saved', scoreMismatch: mismatch };
}

// =====================================================================
// SCORING — mirrors frontend scoring exactly
// =====================================================================

function computeScores_(d) {

  // ---- 1. Skincare Readiness Score (0–100) ----
  var readiness = 0;
  var q1m = { 'Daily': 35, 'A few times a week': 28, 'Occasionally': 18, 'Rarely': 8, 'Never': 0 };
  readiness += q1m[d.q1_usageFrequency] || 0;

  var q2raw   = d.q2_productsUsed || '';
  var q2items = Array.isArray(q2raw)
    ? q2raw
    : (q2raw ? String(q2raw).split(',').map(function(s){ return s.trim(); }) : []);
  var q2active = q2items.filter(function(x){ return x && x !== 'None of the above'; });
  if      (q2active.length === 1) readiness += 10;
  else if (q2active.length === 2) readiness += 18;
  else if (q2active.length >= 3)  readiness += 25;

  var q4m = {
    'I have not spent money on facial skincare': 0,
    'Under ₱500': 10, '₱500–₱1,500': 20,
    '₱1,501–₱3,000': 25, 'Over ₱3,000': 30
  };
  readiness += q4m[d.q4_spendPast6Months] || 0;

  if (d.q5_primaryReason && d.q5_primaryReason !== 'Other') readiness += 10;
  else if (d.q5_primaryReason === 'Other') readiness += 5;
  readiness = Math.min(100, readiness);

  // ---- 2. Brand Relevance Score (0–100) ----
  var relevance = 0;
  var q8m = {
    'Packaging B — New Packaging': 30,
    'No preference': 15,
    'Packaging A — Current Packaging': 5
  };
  relevance += q8m[d.q8_packagingChoice] || 0;

  var q9val = parseInt(d.q9_brandFitScore) || 0;
  var q9m   = { 1: 0, 2: 10, 3: 20, 4: 30, 5: 40 };
  relevance += q9m[q9val] || 0;

  var q19m = {
    'Very positive': 30, 'Positive': 24, 'Neutral': 15,
    'I am not familiar with the brand': 12, 'Negative': 5, 'Very negative': 0
  };
  relevance += q19m[d.q19_rebrandFeeling] || 0;
  relevance = Math.min(100, relevance);

  // ---- 3. Product Trial Intent Score (0–100) ----
  var trial = 0;
  var q10m  = { 'Very likely': 30, 'Likely': 24, 'Neutral': 15, 'Unlikely': 5, 'Very unlikely': 0 };
  trial += q10m[d.q10_tryLikelihood] || 0;

  var q13m  = {
    'SPF moisturizer': 20, 'All-in-one face product': 18,
    'Facial wash': 14, 'Acne or oil-control product': 14,
    'Serum': 10, 'Eye cream': 8, 'I would not buy any': 0
  };
  trial += q13m[d.q13_oneProductChoice] || 0;

  // Q20 is weighted 2× — highest-intent predictor
  var q20m  = { 'Very likely': 50, 'Likely': 40, 'Neutral': 25, 'Unlikely': 8, 'Very unlikely': 0 };
  trial += q20m[d.q20_friendTrialIntent] || 0;
  trial = Math.min(100, trial);

  // ---- 4. Price Acceptance Score (0–100) ----
  var priceM = {
    'Under ₱200': 20, '₱200–₱399': 45, '₱400–₱699': 75,
    '₱700–₱999': 90, '₱1,000 or more': 100
  };
  var price = priceM[d.q14_maxPrice] || 0;

  // ---- 5. Channel Fit Score (0–100) ----
  var prio = ['Watsons', 'Mercury Drug', 'Shopee', 'Lazada', 'TikTok Shop'];
  var cf   = 0;
  if (prio.indexOf(d.q15_channelRank1) !== -1) cf += 60;
  if (prio.indexOf(d.q15_channelRank2) !== -1) cf += 25;
  if (prio.indexOf(d.q15_channelRank3) !== -1) cf += 15;
  cf = Math.min(100, cf);

  // ---- 6. Rebrand Validation Score (0–100) ----
  var rebrand = Math.round(trial * 0.35 + relevance * 0.25 + readiness * 0.15 + price * 0.15 + cf * 0.10);

  return {
    computed_skincareReadinessScore:   readiness,
    computed_brandRelevanceScore:      relevance,
    computed_productTrialIntentScore:  trial,
    computed_priceAcceptanceScore:     price,
    computed_channelFitScore:          cf,
    computed_rebrandValidationScore:   rebrand
  };
}

// =====================================================================
// SEGMENT TAGGING — mirrors frontend logic
// =====================================================================

function computeSegments_(d) {
  var tags = [];

  if (d.q1_usageFrequency === 'Daily' || d.q1_usageFrequency === 'A few times a week')
    tags.push('Current Skincare User');

  var q2raw    = d.q2_productsUsed || '';
  var q2items  = Array.isArray(q2raw)
    ? q2raw
    : (q2raw ? String(q2raw).split(',').map(function(s){ return s.trim(); }) : []);
  var q2active = q2items.filter(function(x){ return x && x !== 'None of the above'; });
  if (q2active.length > 0 && q2active.every(function(x){ return x === 'Bar soap' || x === 'Facial wash'; }))
    tags.push('Low-Maintenance User');

  var partnerBuyers = [
    'My partner or wife buys them','My mother buys them',
    'Another family member buys them','I receive them as gifts'
  ];
  if (partnerBuyers.indexOf(d.q3_buyer) !== -1 ||
      d.q5_primaryReason === 'My partner, wife, or family recommended it')
    tags.push('Partner-Influenced Buyer');

  if (['Very likely','Likely'].indexOf(d.q10_tryLikelihood) !== -1 &&
      ['Very likely','Likely'].indexOf(d.q20_friendTrialIntent) !== -1)
    tags.push('High-Intent Trial User');

  if (d.q14_maxPrice === 'Under ₱200' || d.q14_maxPrice === '₱200–₱399')
    tags.push('Price-Sensitive Buyer');

  if (d.q14_maxPrice === '₱700–₱999' || d.q14_maxPrice === '₱1,000 or more')
    tags.push('Premium-Open Buyer');

  var ranks = [d.q15_channelRank1, d.q15_channelRank2, d.q15_channelRank3];
  if (ranks.some(function(r){ return r === 'Watsons' || r === 'Mercury Drug'; }))
    tags.push('Watsons/Mercury Buyer');

  if (ranks.some(function(r){ return r === 'Shopee' || r === 'Lazada' || r === 'TikTok Shop'; }))
    tags.push('Social-Commerce Buyer');

  if (d.q16_tiktokTrustContent &&
      d.q16_tiktokTrustContent !== 'None — I do not get skincare info from social media')
    tags.push('TikTok-Influenced Buyer');

  if (d.q8_packagingChoice === 'Packaging B — New Packaging' &&
      (d.q19_rebrandFeeling === 'Very positive' || d.q19_rebrandFeeling === 'Positive'))
    tags.push('Rebrand Supporter');

  if (d.respondent_location === 'Metro Manila')
    tags.push('Metro Manila');

  if (['35–39','40–44','45–50'].indexOf(d.respondent_ageRange) !== -1)
    tags.push('35-50 Core Target');

  return tags.join(', ');
}

// =====================================================================
// ANALYTICS AGGREGATION
// =====================================================================

function getAnalytics_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_RESPONSES);
  var base  = {
    ok: true, totalResponses: 0,
    kpi: {}, distributions: {}, segments: {},
    openEnded: {}, utmSources: {}, ageRanges: {}, brandAwareness: {},
    lastUpdated: new Date().toISOString()
  };
  if (!sheet) return base;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return base;

  var headers = data[0];
  var rows    = data.slice(1);
  var total   = rows.length;

  function colIdx(name) { return headers.indexOf(name); }
  function vals(name) {
    var ci = colIdx(name);
    return rows.map(function(r){ return ci >= 0 ? (r[ci] || '') : ''; });
  }
  function countVals(arr) {
    var c = {};
    arr.forEach(function(v){
      var s = String(v || '').trim();
      if (s) c[s] = (c[s] || 0) + 1;
    });
    return c;
  }
  function countMulti(arr) {
    var c = {};
    arr.forEach(function(v){
      String(v || '').split(',').forEach(function(item){
        var s = item.trim();
        if (s) c[s] = (c[s] || 0) + 1;
      });
    });
    return c;
  }
  function avg(arr) {
    var nums = arr.map(Number).filter(function(n){ return !isNaN(n) && n > 0; });
    if (!nums.length) return 0;
    return Math.round(nums.reduce(function(a, b){ return a + b; }, 0) / nums.length);
  }
  function mode(counts) {
    var best = null, bc = 0;
    Object.keys(counts).forEach(function(k){ if (counts[k] > bc){ best = k; bc = counts[k]; } });
    return best;
  }
  function last10(field) {
    var ci = colIdx(field), result = [];
    for (var i = rows.length - 1; i >= 0 && result.length < 10; i--) {
      var v = ci >= 0 ? String(rows[i][ci] || '').trim() : '';
      if (v) result.push({ n: i + 1, text: v });
    }
    return result;
  }

  var segCounts   = countMulti(vals('computed_segmentTags'));
  var q14c        = countVals(vals('q14_maxPrice'));
  var q18c        = countVals(vals('q18_taglineChoice'));
  var q15r1c      = countVals(vals('q15_channelRank1'));
  var q11c        = countVals(vals('q11_confidenceDriver'));
  var q8c         = countVals(vals('q8_packagingChoice'));
  var packBCount  = q8c['Packaging B — New Packaging'] || 0;
  var hiCount     = segCounts['High-Intent Trial User'] || 0;

  var allRanks = vals('q15_channelRank1')
    .concat(vals('q15_channelRank2'))
    .concat(vals('q15_channelRank3'));

  return {
    ok: true,
    totalResponses: total,
    kpi: {
      avgRebrandValidationScore: avg(vals('computed_rebrandValidationScore')),
      avgTrialIntentScore:       avg(vals('computed_productTrialIntentScore')),
      highIntentCount:           hiCount,
      highIntentPct:             Math.round(hiCount / total * 100),
      packagingBPct:             Math.round(packBCount / total * 100),
      bestPriceBand:             mode(q14c),
      winningTagline:            mode(q18c),
      topPurchaseChannel:        mode(q15r1c),
      topConfidenceDriver:       mode(q11c)
    },
    distributions: {
      q1:      countVals(vals('q1_usageFrequency')),
      q2:      countMulti(vals('q2_productsUsed')),
      q8:      q8c,
      q9:      countVals(vals('q9_brandFitScore')),
      q10:     countVals(vals('q10_tryLikelihood')),
      q14:     q14c,
      q15rank1: q15r1c,
      q15all:  countMulti(allRanks),
      q16:     countVals(vals('q16_tiktokTrustContent')),
      q17:     countVals(vals('q17_watsonsShelfIntent')),
      q18:     q18c,
      q19:     countVals(vals('q19_rebrandFeeling')),
      q20:     countVals(vals('q20_friendTrialIntent'))
    },
    segments: segCounts,
    openEnded: {
      q7:      last10('q7_logoWords'),
      q8why:   last10('q8_packagingWhy'),
      q12why:  last10('q12_productNameWhy'),
      q18why:  last10('q18_taglineWhy'),
      q19why:  last10('q19_rebrandWhy'),
      barrier: last10('optional_barrier')
    },
    utmSources:    countVals(vals('utm_source')),
    ageRanges:     countVals(vals('respondent_ageRange')),
    brandAwareness: countMulti(vals('q6_brandAwareness')),
    lastUpdated:   new Date().toISOString()
  };
}

// =====================================================================
// SHEET HELPERS
// =====================================================================

function ensureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet_(SHEET_RESPONSES, RESPONSE_HEADERS);
  getOrCreateSheet_(SHEET_ANALYTICS, ['key', 'value', 'updatedAt']);
  var s = ss.getSheetByName(SHEET_SETTINGS);
  if (!s) {
    s = ss.insertSheet(SHEET_SETTINGS);
    s.appendRow(['key', 'value']);
    s.appendRow(['adminPin',   '2468']);
    s.appendRow(['sheetLink',  '']);
    s.appendRow(['appVersion', APP_VERSION]);
    s.setFrozenRows(1);
  }
}

function getOrCreateSheet_(name, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSetting_(key) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return null;
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) return data[i][1];
  }
  return null;
}

function appendResponse_(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESPONSES);
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

// =====================================================================
// UTILITIES
// =====================================================================

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function uniqueId_() {
  var ts   = Date.now().toString(36).toUpperCase();
  var rand = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return 'RSP-' + ts + '-' + rand;
}

function countBy_(rows, colIndex) {
  var c = {};
  rows.forEach(function(r){
    var v = String(r[colIndex] || '').trim();
    if (v) c[v] = (c[v] || 0) + 1;
  });
  return c;
}

function average_(values) {
  var nums = values.map(Number).filter(function(n){ return !isNaN(n); });
  if (!nums.length) return 0;
  return nums.reduce(function(a, b){ return a + b; }, 0) / nums.length;
}
