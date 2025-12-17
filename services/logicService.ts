
import { Metadata, IndicatorInput, SourceConfidence, TaiScore, TaiLevel } from "../types";

// --- Deterministic Rules Implementation ---

/**
 * Heuristic to determine Data Source Type based on name
 */
const determineSourceType = (srcName: string): string => {
    if (srcName.includes("局") || srcName.includes("部") || srcName.includes("委员会") || srcName.includes("政府")) return "国家机关";
    if (srcName.includes("协会") || srcName.includes("联合会") || srcName.includes("学会")) return "行业协会";
    if (srcName.includes("组织") || srcName.includes("WTO") || srcName.includes("IMF") || srcName.includes("World Bank")) return "国际组织";
    if (srcName.includes("交易所") || srcName.includes("交易中心")) return "行业信息网站"; 
    if (srcName.includes("咨询") || srcName.includes("Research") || srcName.includes("智库")) return "数据、咨询公司";
    if (srcName.includes("公司") || srcName.includes("集团")) return "企业";
    if (srcName.includes("新闻") || srcName.includes("日报") || srcName.includes("网")) return "新闻媒体";
    if (srcName.includes("指数") || srcName.includes("Index")) return "价格指数";
    return "其他";
};

/**
 * Heuristic to determine Granularity Level
 */
const determineGranularity = (name: string, srcName: string, category: string[]): string => {
    const macroKeywords = ["GDP", "CPI", "PPI", "宏观", "总量", "全国", "全球", "人口", "就业率", "M2"];
    const microKeywords = ["公司", "企业", "个股", "单品", "财务报表", "营收", "利润"];
    
    // Check Source/Name for Macro
    if (srcName.includes("统计局") && macroKeywords.some(k => name.toUpperCase().includes(k))) {
        return "L3 (宏观层级)";
    }
    if (name.includes("中国") || name.includes("全国") || name.includes("全球")) {
        return "L3 (宏观层级)";
    }

    // Check for Micro
    if (category.includes("企业数据") || srcName.includes("公告")) {
        return "L1 (微观层级)";
    }
    if (microKeywords.some(k => name.includes(k))) {
        return "L1 (微观层级)";
    }

    // Default to Meso
    return "L2 (中观层级)";
};

/**
 * Heuristic for Indicator Category - Restricted List
 * Allowed: 行业数据、区域数据、企业数据、政策相关、研报相关、新闻相关、其他
 */
const determineCategory = (name: string, srcName: string): string[] => {
    const cats = new Set<string>();
    
    // Priority 1: Text-based types
    if (name.includes("政策") || name.includes("法规") || name.includes("通知") || name.includes("意见")) {
        cats.add("政策相关");
    }
    else if (name.includes("研报") || name.includes("深度报告") || name.includes("纪要")) {
        cats.add("研报相关");
    }
    else if (name.includes("新闻") || name.includes("快讯")) {
        cats.add("新闻相关");
    }
    else {
        // Priority 2: Entity based
        const isEnterprise = srcName.includes("公告") || name.includes("公司") || name.includes("企业") || name.includes("个股");
        if (isEnterprise) {
            cats.add("企业数据");
        }

        const isRegional = name.includes("省") || name.includes("市") || name.includes("区") || name.includes("县");
        // Exclude national
        const isNational = name.includes("全国") || name.includes("中国") || name.includes("China");

        if (isRegional && !isNational) {
            cats.add("区域数据");
        }
        
        // Priority 3: Default to Industry if not others
        if (!cats.has("企业数据") && !cats.has("区域数据")) {
            cats.add("行业数据");
        }
    }

    // Fallback
    if (cats.size === 0) {
        cats.add("其他");
    }

    return Array.from(cats);
};

export const generateRuleBasedMetadata = (input: IndicatorInput): Partial<Metadata> => {
  const isTextLikely = input.name.includes("报告") || input.name.includes("政策") || input.name.includes("纪要");
  const isGov = input.sourceName.includes("局") || input.sourceName.includes("部") || input.sourceName.includes("政府");
  
  // Rule: Source Confidence Logic
  let conf = SourceConfidence.L1;
  if (isGov || input.sourceName.includes("交易所") || input.sourceName.includes("官方") || input.sourceName.includes("统计") || input.sourceName.includes("央行")) {
    conf = SourceConfidence.L3;
  } else if (input.sourceName.includes("协会") || input.sourceName.includes("研究院") || input.sourceName.includes("咨询") || input.sourceName.includes("智库")) {
    conf = SourceConfidence.L2;
  }

  // Calculate Deterministic Fields
  const categories = determineCategory(input.name, input.sourceName);
  const granularity = determineGranularity(input.name, input.sourceName, categories);
  const sourceType = determineSourceType(input.sourceName);

  // Data Volume: User Input Only (No Random)
  let volume = 0;
  if (input.dataVolume && input.dataVolume.trim() !== "") {
    volume = parseInt(input.dataVolume);
  }
  
  // Miss Rate: User Input Only (No Random)
  let miss = 0;
  if (input.missRate && input.missRate.trim() !== "") {
    const val = parseFloat(input.missRate);
    if (!isNaN(val)) {
        miss = val / 100; // e.g. 5 -> 0.05
    }
  }
  
  return {
    indi_id: "IND_" + Math.floor(Math.random() * 999999),
    indi_name_cn: input.name,
    data_type: isTextLikely ? "文本" : "浮点数",
    access_level: "公开",
    upd_freq: isTextLikely ? "不定期" : "月度",
    data_unit: isTextLikely ? "N/A" : (input.name.includes("率") || input.name.includes("比") ? "%" : "单位"),
    src_name: input.sourceName,
    update_time: new Date().toISOString().split('T')[0],
    
    data_volume: volume,
    miss_rate: parseFloat(miss.toFixed(4)),
    cov_start_dt: "2018-01-01",
    cov_end_dt: "2023-12-31",
    avg_val: isTextLikely ? undefined : Math.floor(Math.random() * 100),
    min_val: isTextLikely ? undefined : 0,
    max_val: isTextLikely ? undefined : 200,
    mid_val: isTextLikely ? undefined : 50,
    
    like_cnt: Math.floor(Math.random() * 100),
    dislike_cnt: Math.floor(Math.random() * 5),
    monitor_cnt: Math.floor(Math.random() * 500),

    // Deterministic Fields
    indi_cat: categories, 
    gran_level: granularity,
    src_type: sourceType,
    src_conf: conf,
    
    // Placeholders for AI to fill
    involved_company: undefined, // Changed logic
    industry: [],
    enhanced_tags: [],

    is_data_extraction_involved: isTextLikely,
    indi_status: "生效中",
    is_industry: categories.includes("行业数据"),

    // Manual/Ops Defaults
    related_indicators: ["关联指标_A", "关联指标_B"],
    is_exclusive: false,
    data_owner: "数据运营组",
    ver_no: "v1.0",
    chg_hist: "初始创建"
  };
};

// --- TAI Scoring Engine ---

const getCountScore = (count: number): number => {
    if (count >= 5) return 10;
    if (count === 4) return 8;
    if (count === 3) return 6;
    if (count === 2) return 4;
    if (count === 1) return 2;
    return 0;
};

export const calculateTaiRating = (meta: Metadata): TaiScore => {
  const details: string[] = [];
  
  // --- A. Data Availability (Weight 1) ---
  let availScore = 0;
  const mr = meta.miss_rate * 100;
  
  if (meta.miss_rate === 0) { availScore = 10; details.push("完整性完美 (0%缺失)"); }
  else if (mr <= 5) { availScore = 9; details.push("完整性极高 (≤5%)"); }
  else if (mr <= 10) { availScore = 8; }
  else if (mr <= 20) { availScore = 7; }
  else if (mr <= 30) { availScore = 6; }
  else if (mr <= 50) { availScore = 4; }
  else if (mr <= 80) { availScore = 2; }
  else { availScore = 0; details.push("缺失率过高 (>80%)"); }

  // --- B. Data Credibility (Weight 1) ---
  let credScore = 0;
  if (meta.src_conf === SourceConfidence.L3) { credScore = 10; details.push("权威来源 (L3)"); }
  else if (meta.src_conf === SourceConfidence.L2) { credScore = 8; details.push("专业机构来源 (L2)"); }
  else if (meta.src_conf === SourceConfidence.L1) { credScore = 6; }
  else { credScore = 0; details.push("来源未知 (L0)"); }

  // --- C. Business Match (Weight 1 total) ---
  const sceneCount = meta.main_scene ? meta.main_scene.length : 0;
  const sceneScore = getCountScore(sceneCount);
  if (sceneCount >= 3) details.push(`场景覆盖丰富 (${sceneCount}个)`);

  // Company match: check if involved_company exists and is NOT "不涉及"
  const companyScore = (meta.involved_company && meta.involved_company.trim() !== "" && meta.involved_company !== "不涉及") ? 10 : 0;
  if (companyScore > 0) details.push(`关联企业: ${meta.involved_company}`);

  const industryCount = meta.industry ? meta.industry.length : 0;
  const industryScore = getCountScore(industryCount);

  // Total Match Score (0.6 + 0.1 + 0.3)
  const matchScore = (sceneScore * 0.6) + (companyScore * 0.1) + (industryScore * 0.3);
  const finalMatchScore = Math.round(matchScore * 10) / 10;

  // --- Level Determination (Same Logic) ---
  let level = TaiLevel.NONE;

  if (credScore === 10 && availScore > 6 && finalMatchScore >= 3) {
      level = TaiLevel.TAI3;
  } else if (credScore >= 6 && availScore > 6 && finalMatchScore >= 3) {
      level = TaiLevel.TAI2;
  } else if (credScore >= 6) {
      level = TaiLevel.TAI1;
  }

  // NOTE: Governance Score is Removed from Total Score calculation
  const totalScore = availScore + credScore + finalMatchScore;

  return {
    level,
    totalScore,
    dimensions: {
        availability: availScore,
        credibility: credScore,
        businessMatch: finalMatchScore,
    },
    details
  };
};
