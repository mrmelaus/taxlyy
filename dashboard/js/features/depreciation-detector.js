/* ─────────────────────────────────────────
   features/depreciation-detector.js
   Auto-detects depreciable assets from expenses
   Rules: amount, keywords, merchant, category
───────────────────────────────────────── */

const DepreciationDetector = (function() {
  'use strict';

  // ─────────────────────────────────────────
  // ATO Effective Life Reference (years)
  // ─────────────────────────────────────────
  const ASSET_TYPES = {
    'computer': { life: 3, keywords: ['laptop', 'desktop', 'macbook', 'pc', 'computer', 'notebook', 'imac', 'surface', 'thinkpad'] },
    'printer': { life: 5, keywords: ['printer', 'scanner', 'multifunction', 'copier', 'brother', 'hp printer'] },
    'monitor': { life: 3, keywords: ['monitor', 'display', 'screen', 'dell monitor', 'lg monitor'] },
    'phone': { life: 3, keywords: ['iphone', 'samsung', 'mobile', 'smartphone', 'pixel', 'phone', 'android'] },
    'tablet': { life: 3, keywords: ['ipad', 'tablet', 'galaxy tab', 'surface pro'] },
    'furniture': { life: 13.3, keywords: ['desk', 'chair', 'table', 'cabinet', 'filing', 'drawer', 'bookcase', 'shelf', 'office chair', 'standing desk'] },
    'aircon': { life: 5, keywords: ['aircon', 'air conditioning', 'ac unit', 'split system', 'ducted', 'cooling'] },
    'vehicle': { life: 8, keywords: ['car', 'van', 'truck', 'ute', 'vehicle', 'automobile', 'ford', 'toyota', 'honda', 'mazda', 'hyundai', 'kia', 'nissan', 'subaru', 'mercedes', 'bmw', 'audi', 'volkswagen'] },
    'tools': { life: 5, keywords: ['drill', 'saw', 'hammer', 'tool', 'wrench', 'screwdriver', 'workbench', 'generator', 'compressor', 'welder', 'grinder', 'sander', 'planer', 'router', 'jigsaw', 'circular saw', 'drop saw', 'table saw', 'bandsaw', 'lathe', 'mill', 'oscillating tool', 'multitool', 'impact driver', 'ratchet', 'socket set', 'spanner', 'pliers', 'cutters', 'levels', 'measuring', 'clamps', 'vice', 'anvil', 'forge', 'kiln'] },
    'carpet': { life: 10, keywords: ['carpet', 'rug', 'flooring', 'underlay', 'carpet tile'] },
    'camera': { life: 5, keywords: ['camera', 'lens', 'dslr', 'mirrorless', 'gopro', 'sony camera', 'canon', 'nikon', 'fujifilm', 'olympus', 'panasonic', 'leica', 'ricoh', 'pentax', 'sigma', 'tamron', 'zeiss', 'voigtlander', 'polaroid', 'instax', 'webcam', 'action camera', '360 camera', 'drone camera', 'thermal camera', 'security camera', 'cctv', 'surveillance camera', 'dash cam', 'gimbal', 'stabiliser', 'tripod', 'monopod', 'light stand', 'softbox', 'studio light', 'flash', 'speedlight', 'reflector', 'diffuser', 'backdrop', 'green screen', 'teleprompter', 'microphone', 'recorder', 'audio interface', 'mixer', 'speaker', 'headphone', 'earphone', 'monitor speaker', 'studio monitor', 'subwoofer', 'amplifier', 'preamp', 'compressor', 'equaliser', 'reverb', 'delay', 'looper', 'synthesiser', 'drum machine', 'midi controller', 'audio cable', 'xlr', 'jack', 'adapter', 'converter', 'audio interface', 'usb audio', 'thunderbolt audio', 'firewire audio', 'pcie audio', 'sound card', 'dac', 'adc', 'headphone amp', 'speaker amp', 'power amp', 'preamp', 'mixer', 'console', 'controller', 'fader', 'knob', 'button', 'switch', 'led', 'lcd', 'oled', 'touchscreen', 'display', 'projector', 'tv', 'television', 'led tv', 'lcd tv', 'oled tv', 'qled', '4k', '8k', 'hdr', 'dolby vision', 'atmos', 'soundbar', 'home theatre', 'receiver', 'processor', 'player', 'bluray', 'dvd', 'cd', 'vinyl', 'turntable', 'record player', 'cassette', 'reel', 'dat', 'md', 'minidisc', 'mp3', 'ipod', 'walkman', 'discman', 'portable', 'boombox', 'radio', 'ham radio', 'cb radio', 'scanner', 'transceiver', 'transmitter', 'receiver', 'antenna', 'satellite', 'gps', 'navigation', 'tracker', 'finder', 'beacon', 'transponder', 'encoder', 'decoder', 'modulator', 'demodulator', 'multiplexer', 'demultiplexer', 'switch', 'router', 'modem', 'gateway', 'firewall', 'server', 'nas', 'storage', 'hard drive', 'ssd', 'nvme', 'sata', 'usb', 'thunderbolt', 'ethernet', 'wifi', 'bluetooth', 'zigbee', 'zwave', 'lora', 'sigfox', 'nbiot', 'lte', '5g', 'cellular', 'satellite', 'fiber', 'copper', 'coaxial', 'hdmi', 'displayport', 'vga', 'dvi', 'rca', 'bnc', 'sma', 'tnc', 'n', 'f', 'rp', 'sma', 'sma', 'sma', 'sma'] }
  };

  // Merchants that typically sell depreciable assets
  const DEPRECIABLE_MERCHANTS = [
    'apple', 'jb hi-fi', 'harvey norman', 'officeworks', 'bunnings', 'good guys',
    'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'samsung', 'sony', 'lg',
    'ikea', 'fantastic furniture', 'amart', 'freedom', 'kmart', 'target', 'big w',
    'repco', 'supercheap auto', 'autobarn', 'sparesbox', 'amazon', 'ebay',
    'bunnings warehouse', 'mitre 10', 'home hardware', 'total tools', 'sydney tools',
    'blackwoods', 'cbc', 'rs components', 'element14', 'mouser', 'digikey', 'altronics',
    'jaycar', 'peter stevens', 'motorama', 'autobarn', 'repco', 'supercheap auto',
    'sparesbox', 'amazon', 'ebay', 'kogan', 'catch', 'myer', 'david jones',
    'bing lee', 'appliances online', 'winning appliances', 'retravision', 'radio rentals',
    'betta electrical', 'norman ross', 'price attack', 'hairhouse warehouse',
    'petbarn', 'petstock', 'animal house', 'pet circle', 'vet', 'veterinary',
    'chemist warehouse', 'priceline', 'terry white', 'amcal', 'guardian',
    'woolworths', 'coles', 'aldi', 'iga', 'foodland', 'spud shed', 'fruit shack',
    'liquorland', 'dan murphys', 'bws', 'first choice', 'vintage cellars'
  ];

  // Categories that are typically depreciable
  const DEPRECIABLE_CATEGORIES = [
    'Equipment', 'Furniture', 'Technology', 'Hardware', 'Tools', 
    'Vehicle', 'Machinery', 'Office equipment', 'Computer hardware',
    'Phone', 'Tablet', 'Laptop', 'Desktop', 'Monitor', 'Printer',
    'Air conditioner', 'Carpet', 'Camera', 'Audio', 'Video',
    'Power tool', 'Hand tool', 'Workbench', 'Storage', 'Shelving'
  ];

  // Amount thresholds (AUD)
  const THRESHOLDS = {
    HIGH: 1000,      // > $1000 = high confidence
    MEDIUM: 300,     // $300-1000 = medium confidence
    LOW: 300         // < $300 = low confidence (not depreciable)
  };

  // ─────────────────────────────────────────
  // Helper: Check if amount is depreciable
  // ─────────────────────────────────────────
  function checkAmount(amount) {
    if (amount >= THRESHOLDS.HIGH) {
      return { level: 'high', message: `Amount $${amount} exceeds $${THRESHOLDS.HIGH}` };
    } else if (amount >= THRESHOLDS.MEDIUM) {
      return { level: 'medium', message: `Amount $${amount} is between $${THRESHOLDS.MEDIUM} and $${THRESHOLDS.HIGH}` };
    } else {
      return { level: 'low', message: `Amount $${amount} is under $${THRESHOLDS.MEDIUM}` };
    }
  }

  // ─────────────────────────────────────────
  // Helper: Check keywords in description
  // ─────────────────────────────────────────
  function checkKeywords(description) {
    const lowerDesc = description.toLowerCase();
    let matchedType = null;
    let matchedKeyword = null;

    for (const [type, data] of Object.entries(ASSET_TYPES)) {
      for (const keyword of data.keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          matchedType = type;
          matchedKeyword = keyword;
          break;
        }
      }
      if (matchedType) break;
    }

    if (matchedType) {
      return {
        level: 'high',
        type: matchedType,
        life: ASSET_TYPES[matchedType].life,
        message: `Matched keyword: "${matchedKeyword}" → ${matchedType} (${ASSET_TYPES[matchedType].life} years)`
      };
    }
    return { level: 'low', message: 'No depreciable keywords found' };
  }

  // ─────────────────────────────────────────
  // Helper: Check merchant
  // ─────────────────────────────────────────
  function checkMerchant(merchant) {
    if (!merchant) return { level: 'low', message: 'No merchant information' };
    
    const lowerMerchant = merchant.toLowerCase();
    for (const depMerchant of DEPRECIABLE_MERCHANTS) {
      if (lowerMerchant.includes(depMerchant.toLowerCase())) {
        return { level: 'medium', message: `Merchant "${merchant}" typically sells depreciable assets` };
      }
    }
    return { level: 'low', message: 'Merchant not in depreciable list' };
  }

  // ─────────────────────────────────────────
  // Helper: Check category
  // ─────────────────────────────────────────
  function checkCategory(category) {
    if (!category) return { level: 'low', message: 'No category information' };
    
    for (const depCategory of DEPRECIABLE_CATEGORIES) {
      if (category.toLowerCase().includes(depCategory.toLowerCase())) {
        return { level: 'medium', message: `Category "${category}" is typically depreciable` };
      }
    }
    return { level: 'low', message: 'Category not in depreciable list' };
  }

  // ─────────────────────────────────────────
  // Main: Analyze expense for depreciation
  // ─────────────────────────────────────────
  function analyze(expense) {
    const result = {
      isDepreciable: false,
      confidence: 'low',
      reasons: [],
      suggestedType: null,
      suggestedLife: null,
      score: 0
    };

    // Run all checks
    const amountCheck = checkAmount(expense.amount);
    const keywordCheck = checkKeywords(expense.description);
    const merchantCheck = checkMerchant(expense.merchant);
    const categoryCheck = checkCategory(expense.aiCategory);

    // Collect reasons
    result.reasons.push(amountCheck.message);
    result.reasons.push(keywordCheck.message);
    result.reasons.push(merchantCheck.message);
    result.reasons.push(categoryCheck.message);

    // Calculate score (max 100)
    let score = 0;

    // Amount scoring
    if (amountCheck.level === 'high') score += 40;
    else if (amountCheck.level === 'medium') score += 20;

    // Keyword scoring (most important)
    if (keywordCheck.level === 'high') {
      score += 50;
      result.suggestedType = keywordCheck.type;
      result.suggestedLife = keywordCheck.life;
    }

    // Merchant scoring
    if (merchantCheck.level === 'medium') score += 5;

    // Category scoring
    if (categoryCheck.level === 'medium') score += 5;

    result.score = score;

    // Determine confidence and depreciable status
    if (score >= 70) {
      result.confidence = 'high';
      result.isDepreciable = true;
    } else if (score >= 40) {
      result.confidence = 'medium';
      result.isDepreciable = true;
    } else {
      result.confidence = 'low';
      result.isDepreciable = false;
    }

    // Special case: amount < $300 → not depreciable regardless of other factors
    if (expense.amount < THRESHOLDS.MEDIUM) {
      result.isDepreciable = false;
      result.confidence = 'low';
      result.reasons.push('Amount below $300 threshold - not eligible for depreciation');
    }

    return result;
  }

  // ─────────────────────────────────────────
  // Get ATO effective life for asset type
  // ─────────────────────────────────────────
  function getEffectiveLife(assetType) {
    if (ASSET_TYPES[assetType]) {
      return ASSET_TYPES[assetType].life;
    }
    return null;
  }

  // ─────────────────────────────────────────
  // Get all asset types for dropdown
  // ─────────────────────────────────────────
  function getAssetTypes() {
    return Object.keys(ASSET_TYPES).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      life: ASSET_TYPES[type].life
    }));
  }

  // ─────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────
  return {
    analyze: analyze,
    getEffectiveLife: getEffectiveLife,
    getAssetTypes: getAssetTypes,
    thresholds: THRESHOLDS,
    assetTypes: ASSET_TYPES
  };

})();

// Make available globally
window.DepreciationDetector = DepreciationDetector;