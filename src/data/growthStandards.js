/**
 * 婴幼儿生长标准参考数据
 * - WHO 标准 (WHO Child Growth Standards 2006)
 * - 中国卫健委标准 (WS/T 423-2022, 2023年3月实施)
 *
 * 数据按月份组织，通过线性插值获取按周的参考值
 */

// Z-score 对应的百分位
const Z = {
  p1:  -2.326347,
  p30: -0.524401,
  p50: 0,
  p70: 0.524401,
  p99: 2.326347,
};

// ==================== WHO 数据 (LMS 参数) ====================

// WHO 女童体重 LMS 参数 (0-24月)
const WHO_GIRLS_WEIGHT_LMS = [
  { month: 0,  L: 0.3809, M: 3.2322, S: 0.14171 },
  { month: 1,  L: 0.1714, M: 4.1873, S: 0.13724 },
  { month: 2,  L: 0.0962, M: 5.1282, S: 0.13000 },
  { month: 3,  L: 0.0402, M: 5.8458, S: 0.12619 },
  { month: 4,  L: -0.0050, M: 6.4237, S: 0.12402 },
  { month: 5,  L: -0.0430, M: 6.8985, S: 0.12274 },
  { month: 6,  L: -0.0756, M: 7.2970, S: 0.12204 },
  { month: 7,  L: -0.1039, M: 7.6422, S: 0.12178 },
  { month: 8,  L: -0.1288, M: 7.9487, S: 0.12181 },
  { month: 9,  L: -0.1507, M: 8.2254, S: 0.12199 },
  { month: 10, L: -0.1700, M: 8.4800, S: 0.12223 },
  { month: 11, L: -0.1872, M: 8.7192, S: 0.12247 },
  { month: 12, L: -0.2024, M: 8.9481, S: 0.12268 },
  { month: 15, L: -0.2384, M: 9.6008, S: 0.12299 },
  { month: 18, L: -0.2637, M: 10.2315, S: 0.12309 },
  { month: 21, L: -0.2815, M: 10.8534, S: 0.12335 },
  { month: 24, L: -0.2941, M: 11.4775, S: 0.12390 },
];

// WHO 女童身长 LMS 参数 (L=1, 0-24月)
const WHO_GIRLS_LENGTH_LMS = [
  { month: 0,  M: 49.1477, S: 0.03790 },
  { month: 1,  M: 53.6872, S: 0.03640 },
  { month: 2,  M: 57.0673, S: 0.03568 },
  { month: 3,  M: 59.8029, S: 0.03520 },
  { month: 4,  M: 62.0899, S: 0.03486 },
  { month: 5,  M: 64.0301, S: 0.03463 },
  { month: 6,  M: 65.7311, S: 0.03448 },
  { month: 7,  M: 67.2873, S: 0.03441 },
  { month: 8,  M: 68.7498, S: 0.03440 },
  { month: 9,  M: 70.1435, S: 0.03444 },
  { month: 10, M: 71.4818, S: 0.03452 },
  { month: 11, M: 72.7710, S: 0.03464 },
  { month: 12, M: 74.0150, S: 0.03479 },
  { month: 15, M: 77.5099, S: 0.03534 },
  { month: 18, M: 80.7079, S: 0.03598 },
  { month: 21, M: 83.6654, S: 0.03666 },
  { month: 24, M: 86.4153, S: 0.03734 },
];

// WHO 男童体重 LMS 参数 (0-24月)
const WHO_BOYS_WEIGHT_LMS = [
  { month: 0,  L: 0.3487, M: 3.3464, S: 0.14602 },
  { month: 1,  L: 0.2297, M: 4.4709, S: 0.13395 },
  { month: 2,  L: 0.1970, M: 5.5675, S: 0.12385 },
  { month: 3,  L: 0.1738, M: 6.3762, S: 0.11727 },
  { month: 4,  L: 0.1553, M: 7.0023, S: 0.11316 },
  { month: 5,  L: 0.1395, M: 7.5105, S: 0.11080 },
  { month: 6,  L: 0.1257, M: 7.9340, S: 0.10958 },
  { month: 7,  L: 0.1134, M: 8.2970, S: 0.10902 },
  { month: 8,  L: 0.1021, M: 8.6151, S: 0.10882 },
  { month: 9,  L: 0.0917, M: 8.9014, S: 0.10881 },
  { month: 10, L: 0.0820, M: 9.1649, S: 0.10891 },
  { month: 11, L: 0.0730, M: 9.4122, S: 0.10906 },
  { month: 12, L: 0.0644, M: 9.6479, S: 0.10925 },
  { month: 15, L: 0.0413, M: 10.3108, S: 0.11007 },
  { month: 18, L: 0.0211, M: 10.9385, S: 0.11119 },
  { month: 21, L: 0.0029, M: 11.5486, S: 0.11261 },
  { month: 24, L: -0.0137, M: 12.1515, S: 0.11426 },
];

// WHO 男童身长 LMS 参数 (L=1, 0-24月)
const WHO_BOYS_LENGTH_LMS = [
  { month: 0,  M: 49.8842, S: 0.03795 },
  { month: 1,  M: 54.7244, S: 0.03557 },
  { month: 2,  M: 58.4249, S: 0.03424 },
  { month: 3,  M: 61.4292, S: 0.03328 },
  { month: 4,  M: 63.8860, S: 0.03257 },
  { month: 5,  M: 65.9026, S: 0.03204 },
  { month: 6,  M: 67.6236, S: 0.03165 },
  { month: 7,  M: 69.1645, S: 0.03139 },
  { month: 8,  M: 70.5994, S: 0.03124 },
  { month: 9,  M: 71.9687, S: 0.03117 },
  { month: 10, M: 73.2812, S: 0.03118 },
  { month: 11, M: 74.5388, S: 0.03125 },
  { month: 12, M: 75.7488, S: 0.03137 },
  { month: 15, M: 79.1458, S: 0.03197 },
  { month: 18, M: 82.2587, S: 0.03279 },
  { month: 21, M: 85.1348, S: 0.03376 },
  { month: 24, M: 87.8161, S: 0.03479 },
];

// ==================== 中国卫健委数据 (WS/T 423-2022) ====================

// 中国 男童 身长/身高 (cm) - 月龄, P3, P10, P25, P50, P75, P90, P97
const CHINA_BOYS_HEIGHT = [
  { month: 0,  p3: 47.6, p10: 48.7, p25: 49.9, p50: 51.2, p75: 52.5, p90: 53.6, p97: 54.8 },
  { month: 1,  p3: 51.3, p10: 52.5, p25: 53.8, p50: 55.1, p75: 56.5, p90: 57.7, p97: 59.0 },
  { month: 2,  p3: 54.9, p10: 56.2, p25: 57.5, p50: 59.0, p75: 60.4, p90: 61.7, p97: 63.0 },
  { month: 3,  p3: 58.0, p10: 59.4, p25: 60.7, p50: 62.2, p75: 63.7, p90: 65.1, p97: 66.4 },
  { month: 4,  p3: 60.5, p10: 61.9, p25: 63.3, p50: 64.8, p75: 66.4, p90: 67.8, p97: 69.1 },
  { month: 5,  p3: 62.5, p10: 63.9, p25: 65.4, p50: 66.9, p75: 68.5, p90: 69.9, p97: 71.3 },
  { month: 6,  p3: 64.2, p10: 65.7, p25: 67.1, p50: 68.7, p75: 70.3, p90: 71.8, p97: 73.2 },
  { month: 7,  p3: 65.7, p10: 67.2, p25: 68.7, p50: 70.3, p75: 71.9, p90: 73.4, p97: 74.9 },
  { month: 8,  p3: 67.1, p10: 68.6, p25: 70.1, p50: 71.7, p75: 73.4, p90: 74.9, p97: 76.4 },
  { month: 9,  p3: 68.3, p10: 69.8, p25: 71.4, p50: 73.1, p75: 74.7, p90: 76.3, p97: 77.8 },
  { month: 10, p3: 69.5, p10: 71.0, p25: 72.6, p50: 74.3, p75: 76.0, p90: 77.6, p97: 79.1 },
  { month: 11, p3: 70.7, p10: 72.2, p25: 73.8, p50: 75.5, p75: 77.3, p90: 78.8, p97: 80.4 },
  { month: 12, p3: 71.7, p10: 73.3, p25: 74.9, p50: 76.7, p75: 78.5, p90: 80.1, p97: 81.6 },
  { month: 15, p3: 74.8, p10: 76.4, p25: 78.1, p50: 80.0, p75: 81.8, p90: 83.5, p97: 85.1 },
  { month: 18, p3: 77.7, p10: 79.3, p25: 81.2, p50: 83.1, p75: 85.0, p90: 86.8, p97: 88.5 },
  { month: 21, p3: 80.5, p10: 82.1, p25: 84.1, p50: 86.1, p75: 88.1, p90: 89.9, p97: 91.7 },
  { month: 24, p3: 82.4, p10: 84.2, p25: 86.1, p50: 88.2, p75: 90.3, p90: 92.2, p97: 94.0 },
];

// 中国 女童 身长/身高 (cm) - 月龄, P3, P10, P25, P50, P75, P90, P97
const CHINA_GIRLS_HEIGHT = [
  { month: 0,  p3: 46.8, p10: 47.9, p25: 49.1, p50: 50.3, p75: 51.6, p90: 52.7, p97: 53.8 },
  { month: 1,  p3: 50.4, p10: 51.6, p25: 52.8, p50: 54.1, p75: 55.4, p90: 56.6, p97: 57.8 },
  { month: 2,  p3: 53.8, p10: 55.0, p25: 56.3, p50: 57.7, p75: 59.1, p90: 60.4, p97: 61.6 },
  { month: 3,  p3: 56.7, p10: 58.0, p25: 59.3, p50: 60.8, p75: 62.2, p90: 63.5, p97: 64.8 },
  { month: 4,  p3: 59.1, p10: 60.4, p25: 61.7, p50: 63.3, p75: 64.8, p90: 66.1, p97: 67.4 },
  { month: 5,  p3: 61.0, p10: 62.4, p25: 63.8, p50: 65.3, p75: 66.9, p90: 68.2, p97: 69.6 },
  { month: 6,  p3: 62.7, p10: 64.1, p25: 65.5, p50: 67.1, p75: 68.7, p90: 70.1, p97: 71.5 },
  { month: 7,  p3: 64.2, p10: 65.6, p25: 67.1, p50: 68.7, p75: 70.3, p90: 71.7, p97: 73.1 },
  { month: 8,  p3: 65.6, p10: 67.0, p25: 68.5, p50: 70.1, p75: 71.7, p90: 73.2, p97: 74.7 },
  { month: 9,  p3: 66.8, p10: 68.3, p25: 69.8, p50: 71.5, p75: 73.1, p90: 74.6, p97: 76.1 },
  { month: 10, p3: 68.1, p10: 69.6, p25: 71.1, p50: 72.8, p75: 74.5, p90: 76.0, p97: 77.5 },
  { month: 11, p3: 69.2, p10: 70.8, p25: 72.3, p50: 74.0, p75: 75.7, p90: 77.3, p97: 78.8 },
  { month: 12, p3: 70.4, p10: 71.9, p25: 73.5, p50: 75.2, p75: 77.0, p90: 78.6, p97: 80.1 },
  { month: 15, p3: 73.4, p10: 75.0, p25: 76.6, p50: 78.4, p75: 80.1, p90: 81.8, p97: 83.4 },
  { month: 18, p3: 76.2, p10: 77.8, p25: 79.6, p50: 81.4, p75: 83.2, p90: 84.9, p97: 86.6 },
  { month: 21, p3: 78.9, p10: 80.6, p25: 82.4, p50: 84.3, p75: 86.1, p90: 87.8, p97: 89.6 },
  { month: 24, p3: 81.0, p10: 82.8, p25: 84.7, p50: 86.6, p75: 88.5, p90: 90.3, p97: 92.1 },
];

// 中国 男童 体重 SD 表 (kg) - 月龄, -3SD, -2SD, -1SD, 中位数, +1SD, +2SD, +3SD
const CHINA_BOYS_WEIGHT_SD = [
  { month: 0,  m3: 2.4, m2: 2.7, m1: 3.1, M: 3.5, p1: 3.9, p2: 4.3, p3: 4.7 },
  { month: 1,  m3: 3.2, m2: 3.6, m1: 4.1, M: 4.6, p1: 5.1, p2: 5.6, p3: 6.2 },
  { month: 2,  m3: 4.1, m2: 4.6, m1: 5.2, M: 5.8, p1: 6.5, p2: 7.2, p3: 8.0 },
  { month: 3,  m3: 4.9, m2: 5.5, m1: 6.1, M: 6.8, p1: 7.6, p2: 8.4, p3: 9.3 },
  { month: 4,  m3: 5.6, m2: 6.2, m1: 6.9, M: 7.6, p1: 8.5, p2: 9.4, p3: 10.4 },
  { month: 5,  m3: 6.1, m2: 6.7, m1: 7.5, M: 8.2, p1: 9.2, p2: 10.2, p3: 11.3 },
  { month: 6,  m3: 6.5, m2: 7.2, m1: 8.0, M: 8.8, p1: 9.8, p2: 10.9, p3: 12.0 },
  { month: 7,  m3: 6.9, m2: 7.6, m1: 8.4, M: 9.3, p1: 10.3, p2: 11.4, p3: 12.6 },
  { month: 8,  m3: 7.2, m2: 7.9, m1: 8.8, M: 9.7, p1: 10.8, p2: 11.9, p3: 13.2 },
  { month: 9,  m3: 7.5, m2: 8.3, m1: 9.2, M: 10.1, p1: 11.2, p2: 12.4, p3: 13.7 },
  { month: 10, m3: 7.8, m2: 8.6, m1: 9.5, M: 10.5, p1: 11.6, p2: 12.9, p3: 14.2 },
  { month: 11, m3: 8.1, m2: 8.9, m1: 9.8, M: 10.8, p1: 12.0, p2: 13.3, p3: 14.7 },
  { month: 12, m3: 8.3, m2: 9.1, m1: 10.1, M: 11.1, p1: 12.3, p2: 13.6, p3: 15.1 },
  { month: 15, m3: 9.0, m2: 9.9, m1: 10.9, M: 12.0, p1: 13.3, p2: 14.7, p3: 16.3 },
  { month: 18, m3: 9.7, m2: 10.6, m1: 11.7, M: 12.9, p1: 14.3, p2: 15.9, p3: 17.6 },
  { month: 21, m3: 10.3, m2: 11.3, m1: 12.4, M: 13.7, p1: 15.2, p2: 16.9, p3: 18.8 },
  { month: 24, m3: 10.9, m2: 11.9, m1: 13.2, M: 14.5, p1: 16.1, p2: 17.9, p3: 20.0 },
];

// 中国 女童 体重 SD 表 (kg) - 月龄, -3SD, -2SD, -1SD, 中位数, +1SD, +2SD, +3SD
const CHINA_GIRLS_WEIGHT_SD = [
  { month: 0,  m3: 2.3, m2: 2.6, m1: 3.0, M: 3.3, p1: 3.7, p2: 4.1, p3: 4.6 },
  { month: 1,  m3: 3.0, m2: 3.4, m1: 3.8, M: 4.3, p1: 4.8, p2: 5.3, p3: 5.9 },
  { month: 2,  m3: 3.8, m2: 4.3, m1: 4.8, M: 5.4, p1: 6.0, p2: 6.7, p3: 7.4 },
  { month: 3,  m3: 4.5, m2: 5.0, m1: 5.6, M: 6.2, p1: 6.9, p2: 7.7, p3: 8.6 },
  { month: 4,  m3: 5.1, m2: 5.6, m1: 6.3, M: 7.0, p1: 7.8, p2: 8.7, p3: 9.7 },
  { month: 5,  m3: 5.6, m2: 6.2, m1: 6.9, M: 7.6, p1: 8.5, p2: 9.5, p3: 10.6 },
  { month: 6,  m3: 6.0, m2: 6.6, m1: 7.4, M: 8.2, p1: 9.1, p2: 10.1, p3: 11.3 },
  { month: 7,  m3: 6.4, m2: 7.0, m1: 7.8, M: 8.6, p1: 9.6, p2: 10.7, p3: 11.9 },
  { month: 8,  m3: 6.7, m2: 7.4, m1: 8.2, M: 9.0, p1: 10.1, p2: 11.2, p3: 12.5 },
  { month: 9,  m3: 7.0, m2: 7.7, m1: 8.5, M: 9.4, p1: 10.5, p2: 11.7, p3: 13.0 },
  { month: 10, m3: 7.3, m2: 8.0, m1: 8.9, M: 9.8, p1: 10.9, p2: 12.1, p3: 13.5 },
  { month: 11, m3: 7.5, m2: 8.3, m1: 9.2, M: 10.1, p1: 11.3, p2: 12.5, p3: 13.9 },
  { month: 12, m3: 7.8, m2: 8.6, m1: 9.5, M: 10.5, p1: 11.7, p2: 13.0, p3: 14.4 },
  { month: 15, m3: 8.5, m2: 9.4, m1: 10.4, M: 11.4, p1: 12.7, p2: 14.1, p3: 15.7 },
  { month: 18, m3: 9.2, m2: 10.2, m1: 11.2, M: 12.4, p1: 13.8, p2: 15.3, p3: 17.1 },
  { month: 21, m3: 9.9, m2: 10.9, m1: 12.0, M: 13.3, p1: 14.8, p2: 16.5, p3: 18.3 },
  { month: 24, m3: 10.5, m2: 11.6, m1: 12.8, M: 14.1, p1: 15.7, p2: 17.5, p3: 19.5 },
];

// ==================== 辅助函数 ====================

/**
 * 使用 LMS 公式计算百分位值
 * X = M * (1 + L * S * Z)^(1/L)  when L ≠ 0
 * X = M * exp(S * Z)            when L = 0
 * X = M * (1 + S * Z)           when L = 1
 */
function lmsToValue(L, M, S, z) {
  if (L === 0) {
    return M * Math.exp(S * z);
  } else if (L === 1) {
    return M * (1 + S * z);
  } else {
    return M * Math.pow(1 + L * S * z, 1 / L);
  }
}

/**
 * 从 LMS 参数数组计算所有百分位
 */
function lmsArrayToPercentiles(lmsArray) {
  return lmsArray.map(item => {
    const L = item.L !== undefined ? item.L : 1;
    const result = { month: item.month };
    for (const [key, z] of Object.entries(Z)) {
      result[key] = Math.round(lmsToValue(L, item.M, item.S, z) * 100) / 100;
    }
    return result;
  });
}

/**
 * 从中国身高数据计算所有百分位（含 P1, P30, P70, P99 估算）
 * 使用 P3/P97 估算 SD 来计算 P1/P99
 * 使用 P25/P75 估算 SD 来计算 P30/P70
 */
function chinaHeightToPercentiles(data) {
  return data.map(item => {
    // SD from P3/P97: P3 ≈ M - 1.881*SD, P97 ≈ M + 1.881*SD
    const sd_3_97 = (item.p97 - item.p3) / (2 * 1.881);
    // SD from P25/P75: P25 ≈ M - 0.674*SD, P75 ≈ M + 0.674*SD
    const sd_25_75 = (item.p75 - item.p25) / (2 * 0.674);

    return {
      month: item.month,
      p1:  Math.round((item.p50 + Z.p1  * sd_3_97) * 100) / 100,
      p30: Math.round((item.p50 + Z.p30 * sd_25_75) * 100) / 100,
      p50: item.p50,
      p70: Math.round((item.p50 + Z.p70 * sd_25_75) * 100) / 100,
      p99: Math.round((item.p50 + Z.p99 * sd_3_97) * 100) / 100,
    };
  });
}

/**
 * 从中国体重 SD 表计算所有百分位
 * SD 直接从中位数和 -1SD / +1SD 差异估算
 */
function chinaWeightToPercentiles(data) {
  return data.map(item => {
    // SD 从 ±1SD 估算: +1SD - M = 1*SD
    const sdDown = (item.M - item.m1);
    const sdUp = (item.p1 - item.M);
    const SD = (sdDown + sdUp) / 2;

    return {
      month: item.month,
      p1:  Math.round((item.M + Z.p1  * SD) * 100) / 100,
      p30: Math.round((item.M + Z.p30 * SD) * 100) / 100,
      p50: item.M,
      p70: Math.round((item.M + Z.p70 * SD) * 100) / 100,
      p99: Math.round((item.M + Z.p99 * SD) * 100) / 100,
    };
  });
}

// ==================== 预计算所有百分位数据 ====================

const WHO_GIRLS_WEIGHT = lmsArrayToPercentiles(WHO_GIRLS_WEIGHT_LMS);
const WHO_GIRLS_LENGTH = lmsArrayToPercentiles(WHO_GIRLS_LENGTH_LMS);
const WHO_BOYS_WEIGHT = lmsArrayToPercentiles(WHO_BOYS_WEIGHT_LMS);
const WHO_BOYS_LENGTH = lmsArrayToPercentiles(WHO_BOYS_LENGTH_LMS);

const CHINA_BOYS_HEIGHT_P = chinaHeightToPercentiles(CHINA_BOYS_HEIGHT);
const CHINA_GIRLS_HEIGHT_P = chinaHeightToPercentiles(CHINA_GIRLS_HEIGHT);
const CHINA_BOYS_WEIGHT_P = chinaWeightToPercentiles(CHINA_BOYS_WEIGHT_SD);
const CHINA_GIRLS_WEIGHT_P = chinaWeightToPercentiles(CHINA_GIRLS_WEIGHT_SD);

// ==================== 数据集索引 ====================

const DATA_SETS = {
  who: {
    boy: {
      height: WHO_BOYS_LENGTH,
      weight: WHO_BOYS_WEIGHT,
    },
    girl: {
      height: WHO_GIRLS_LENGTH,
      weight: WHO_GIRLS_WEIGHT,
    },
  },
  china: {
    boy: {
      height: CHINA_BOYS_HEIGHT_P,
      weight: CHINA_BOYS_WEIGHT_P,
    },
    girl: {
      height: CHINA_GIRLS_HEIGHT_P,
      weight: CHINA_GIRLS_WEIGHT_P,
    },
  },
};

// ==================== 插值函数 ====================

const WEEKS_PER_MONTH = 4.34524;

/**
 * 线性插值
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 从月度数据中按周插值获取参考值
 * @param {Array} monthlyData - 月度百分位数据 [{month, p1, p30, p50, p70, p99}]
 * @param {number} week - 周数（浮点数）
 * @returns {{p1, p30, p50, p70, p99}}
 */
function interpolateByWeek(monthlyData, week) {
  const month = week / WEEKS_PER_MONTH;

  // 边界处理
  if (month <= monthlyData[0].month) {
    const d = monthlyData[0];
    return { p1: d.p1, p30: d.p30, p50: d.p50, p70: d.p70, p99: d.p99 };
  }
  const last = monthlyData[monthlyData.length - 1];
  if (month >= last.month) {
    return { p1: last.p1, p30: last.p30, p50: last.p50, p70: last.p70, p99: last.p99 };
  }

  // 找到相邻两个数据点
  let i = 0;
  while (i < monthlyData.length - 1 && monthlyData[i + 1].month < month) {
    i++;
  }
  const d0 = monthlyData[i];
  const d1 = monthlyData[i + 1];
  const t = (month - d0.month) / (d1.month - d0.month);

  return {
    p1:  Math.round(lerp(d0.p1,  d1.p1,  t) * 100) / 100,
    p30: Math.round(lerp(d0.p30, d1.p30, t) * 100) / 100,
    p50: Math.round(lerp(d0.p50, d1.p50, t) * 100) / 100,
    p70: Math.round(lerp(d0.p70, d1.p70, t) * 100) / 100,
    p99: Math.round(lerp(d0.p99, d1.p99, t) * 100) / 100,
  };
}

/**
 * 获取指定标准、性别、指标、周数的参考值
 * @param {'who'|'china'} standard - 标准来源
 * @param {'boy'|'girl'} gender - 性别
 * @param {'height'|'weight'} metric - 指标
 * @param {number} week - 周数
 * @returns {{p1, p30, p50, p70, p99}}
 */
export function getReferenceValues(standard, gender, metric, week) {
  const data = DATA_SETS[standard]?.[gender]?.[metric];
  if (!data) return null;
  return interpolateByWeek(data, week);
}

/**
 * 生成用于图表的参考线数据
 * @param {'who'|'china'} standard
 * @param {'boy'|'girl'} gender
 * @param {'height'|'weight'} metric
 * @param {number} minWeek - 最小周数
 * @param {number} maxWeek - 最大周数
 * @returns {Array<{week, p1, p30, p50, p70, p99}>}
 */
export function getReferenceLines(standard, gender, metric, minWeek, maxWeek) {
  // 扩展范围以确保参考线覆盖整个图表
  const startWeek = Math.max(0, Math.floor(minWeek) - 2);
  const endWeek = Math.ceil(maxWeek) + 2;
  const points = [];
  // 每半周生成一个点以确保曲线平滑
  const step = 0.5;
  for (let w = startWeek; w <= endWeek; w += step) {
    const values = getReferenceValues(standard, gender, metric, w);
    if (values) {
      points.push({ week: Math.round(w * 10) / 10, ...values });
    }
  }
  return points;
}

/**
 * 获取数据覆盖的周数范围
 */
export function getWeekRange(standard, gender, metric) {
  const data = DATA_SETS[standard]?.[gender]?.[metric];
  if (!data) return { min: 0, max: 104 };
  return {
    min: 0,
    max: Math.round(data[data.length - 1].month * WEEKS_PER_MONTH),
  };
}
