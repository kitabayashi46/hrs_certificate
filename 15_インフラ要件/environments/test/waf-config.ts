export interface WafConfig {
  managedRuleGroups: string[];
  rateLimitPerMinute: number;
  allowedIpSets: {
    internal: string[];
  };
  stgHostHeaderScopeDown: string;
  adminPathPattern: string;
}

// stg/prdで差分がない共有設定のため、stg.ts/prd.tsではなくこのファイルに集約する(docs/functional-design.md 3.1.2節)
export const wafConfig: WafConfig = {
  managedRuleGroups: ['AWSManagedRulesCommonRuleSet'],
  rateLimitPerMinute: 12000,
  allowedIpSets: {
    // 本社:111.98.250.151/32、Cato:210.227.234.114/32(Cato経路は顧客確認中、docs/ideas/external-parameters.md参照)
    internal: ['106.72.212.130/32'],
  },
  stgHostHeaderScopeDown: 'stg-chem.skysoft.jp',
  adminPathPattern: '/staff/',
};
