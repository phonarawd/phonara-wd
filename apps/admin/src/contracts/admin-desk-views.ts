import type { useAdminWalletDesk } from '../hooks/admin/useAdminWalletDesk';

import type { useAdminUsersDesk } from '../hooks/admin/useAdminUsersDesk';

import type { useAdminCasinoDesk } from '../hooks/admin/useAdminCasinoDesk';

import type { useAdminStakingDesk } from '../hooks/admin/useAdminStakingDesk';

import type { useAdminEarnDesk } from '../hooks/admin/useAdminEarnDesk';

import type { useAdminCompliance } from '../hooks/admin/useAdminCompliance';

import type { useAdminOperations } from '../hooks/admin/useAdminOperations';

import type { useAdminCmsDesk } from '../hooks/admin/useAdminCmsDesk';

import type { useAdminOverview } from '../hooks/admin/useAdminOverview';

import type { UseAdminWalletDesk } from '../hooks/admin/useAdminWalletDeskMock';

import type { UseAdminUsersDesk } from '../hooks/admin/useAdminUsersDeskMock';

import type { UseAdminCasinoDesk } from '../hooks/admin/useAdminCasinoDeskMock';

import type { UseAdminStakingDesk } from '../hooks/admin/useAdminStakingDesk';

import type { UseAdminEarnDesk } from '../hooks/admin/useAdminEarnDeskMock';

import type { UseAdminCompliance } from '../hooks/admin/useAdminComplianceMock';

import type { UseAdminOperations } from '../hooks/admin/useAdminOperationsMock';

import type { UseAdminCmsDesk } from '../hooks/admin/useAdminCmsDeskMock';

import type { UseAdminOverview } from '../hooks/admin/useAdminOverview';

import type { FreezeControllerView } from './controller-view-freeze';

/** Frozen read+write contracts — independent of hook `ReturnType` aliases. */

export type AdminWalletDeskControllerView = UseAdminWalletDesk;

export type AdminUsersDeskControllerView = UseAdminUsersDesk;

export type AdminCasinoDeskControllerView = UseAdminCasinoDesk;

export type AdminStakingDeskControllerView = UseAdminStakingDesk;

export type AdminEarnDeskControllerView = UseAdminEarnDesk;

export type AdminComplianceControllerView = UseAdminCompliance;

export type AdminOperationsControllerView = UseAdminOperations;

export type AdminCmsDeskControllerView = UseAdminCmsDesk;

export type AdminOverviewControllerView = UseAdminOverview;

export type _AdminWalletFreeze = FreezeControllerView<
  AdminWalletDeskControllerView,
  ReturnType<typeof useAdminWalletDesk>
>;

export type _AdminUsersFreeze = FreezeControllerView<
  AdminUsersDeskControllerView,
  ReturnType<typeof useAdminUsersDesk>
>;

export type _AdminCasinoFreeze = FreezeControllerView<
  AdminCasinoDeskControllerView,
  ReturnType<typeof useAdminCasinoDesk>
>;

export type _AdminStakingFreeze = FreezeControllerView<
  AdminStakingDeskControllerView,
  ReturnType<typeof useAdminStakingDesk>
>;

export type _AdminEarnFreeze = FreezeControllerView<
  AdminEarnDeskControllerView,
  ReturnType<typeof useAdminEarnDesk>
>;

export type _AdminComplianceFreeze = FreezeControllerView<
  AdminComplianceControllerView,
  ReturnType<typeof useAdminCompliance>
>;

export type _AdminOperationsFreeze = FreezeControllerView<
  AdminOperationsControllerView,
  ReturnType<typeof useAdminOperations>
>;

export type _AdminCmsFreeze = FreezeControllerView<
  AdminCmsDeskControllerView,
  ReturnType<typeof useAdminCmsDesk>
>;

export type _AdminOverviewFreeze = FreezeControllerView<
  AdminOverviewControllerView,
  ReturnType<typeof useAdminOverview>
>;
