import { EnvConfig } from './types';

export const stgConfig: EnvConfig = {
  envName: 'stg',
  ecs: {
    desiredCount: 1,
    cpu: 1024,
    memoryLimitMiB: 2048,
  },
  aurora: {
    minCapacity: 0.5,
    maxCapacity: 1,
    backupRetentionDays: 3,
  },
  certificateArn: 'arn:aws:acm:ap-northeast-1:682713989370:certificate/52f98171-9cce-4ffb-b5f6-e35896f29426',
  appDomainName: 'stg-chem.skysoft.jp',
  hostedZoneId: 'Z00482082KYQLMP1HAGLB',
  existingS3BucketName: 'street-light-cloud-eno',
  opsNotificationEmail: 'enomoto@skygp.co.jp',  
  sesSenderDomain: 'skysoft.jp',
  webUrlJa: 'https://www.hirose.com/ja/product/login',
  webUrlEn: 'https://www.hirose.com/en/product/login',
  // ログインAPIのURL(未決定事項)。stg用の実際のエンドポイントが確定次第、実値へ差し替える
  loginApiUrl: 'http://localhost:8080/api/auth/mock-login',
  smtpFrom: 'greenmeister.support.3p@skysoft.jp',
  // SMTP認証情報のSecrets Managerシークレット名(未決定事項)。運用メモ.mdの手順で手動作成後、実値へ差し替える
  smtpCredentialSecretName: 'Chem-smtp-credential',
};
