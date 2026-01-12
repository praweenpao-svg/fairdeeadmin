export interface StaffMember {
  id: string;
  name: string;
  email: string;
  team: string | null;
  startTime: string;
  endTime: string;
  shift2StartTime: string;
  shift2EndTime: string;
}

export const mockStaffMembers: StaffMember[] = [
  {
    id: '1',
    name: '(MLM_KAM) - Mo',
    email: 'aunnop.t@fairdee.co.th',
    team: 'AST',
    startTime: '09:00:00',
    endTime: '11:30:00',
    shift2StartTime: '12:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '2',
    name: 'Team MLM- Pat',
    email: 'tanyapat.m@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '11:30:00',
    shift2StartTime: '12:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '3',
    name: '(MLM_KAM) - Jane',
    email: 'tanchanok.s@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '4',
    name: '(MLM_SC) - Toon',
    email: 'wipawee.p@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '5',
    name: '(MLM_KAM) - June',
    email: 'lalita.k@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '6',
    name: '(Delivery) - Nut',
    email: 'nutnaphee.s@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '7',
    name: '(Delivery) - Pang',
    email: 'panida.k@fairdee.co.th',
    team: 'DE',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '8',
    name: '(MLM_SC) - Katay',
    email: 'kannika.p@fairdee.co.th',
    team: 'AST',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '9',
    name: 'Delivery - Som',
    email: 'hatairat.w@fairdee.co.th',
    team: null,
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '10',
    name: '(MLM_RF) - Dear',
    email: 'pikul.b@fairdee.co.th',
    team: 'Admin',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '11',
    name: '(MLM_RF) - Ham',
    email: 'phatsiya.p@fairdee.co.th',
    team: 'Admin',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '12',
    name: '(FD_AST) - Tuk',
    email: 'phuchisa.p@fairdee.co.th',
    team: 'AST',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
];

export const defaultTeams = ['AST', 'DE', 'Admin'];
