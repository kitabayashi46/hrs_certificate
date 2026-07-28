import { EnvConfig } from './types';

export const prdConfig: EnvConfig = {
  envName: 'prd',
  ecs: {
    desiredCount: 1,
    cpu: 1024,
    memoryLimitMiB: 2048,
  },
  aurora: {
    minCapacity: 1,
    maxCapacity: 4,
    backupRetentionDays: 3,
  },
  certificateArn: 'arn:aws:acm:ap-northeast-1:682713989370:certificate/182e9d11-fa9e-40e2-8faa-aea74a6cc583',
  appDomainName: 'chem.skysoft.jp',
  hostedZoneId: 'Z07227143FYN5KEO2UVZA',
  existingS3BucketName: 'street-light-cloud-eno',
  opsNotificationEmail: 'enomoto@skygp.co.jp',
  sesSenderDomain: 'skysoft.jp',
  webUrlJa: 'https://www.hirose.com/ja/product/login',
  webUrlEn: 'https://www.hirose.com/en/product/login',
  // ログインAPIのURL(未決定事項)。prd用の実際のエンドポイントが確定次第、実値へ差し替える
  loginApiUrl: 'http://localhost:8080/api/auth/mock-login',
  smtpFrom: 'greenmeister.support.3p@skysoft.jp',
  // SMTP認証情報のSecrets Managerシークレット名(未決定事項)。運用メモ.mdの手順で手動作成後、実値へ差し替える
  smtpCredentialSecretName: 'Chem-smtp-credential',
};
