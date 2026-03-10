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
  // AST RF team
  {
    id: '1',
    name: 'Ricky',
    email: 'ricky@fairdee.co.th',
    team: 'AST RF',
    startTime: '09:00:00',
    endTime: '11:30:00',
    shift2StartTime: '12:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '2',
    name: 'Jenny',
    email: 'jenny@fairdee.co.th',
    team: 'AST RF',
    startTime: '09:00:00',
    endTime: '11:30:00',
    shift2StartTime: '12:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '3',
    name: 'Tommy',
    email: 'tommy@fairdee.co.th',
    team: 'AST RF',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  // AST SC team
  {
    id: '4',
    name: 'Lisa',
    email: 'lisa@fairdee.co.th',
    team: 'AST SC',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '5',
    name: 'Mike',
    email: 'mike@fairdee.co.th',
    team: 'AST SC',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '6',
    name: 'Nina',
    email: 'nina@fairdee.co.th',
    team: 'AST SC',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  // DE team
  {
    id: '7',
    name: 'Oscar',
    email: 'oscar@fairdee.co.th',
    team: 'DE',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '8',
    name: 'Paula',
    email: 'paula@fairdee.co.th',
    team: 'DE',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '9',
    name: 'Quinn',
    email: 'quinn@fairdee.co.th',
    team: 'DE',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '10',
    name: 'Pao',
    email: 'pao@fairdee.co.th',
    team: 'DE',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  // Admin team
  {
    id: '11',
    name: 'Rachel',
    email: 'rachel@fairdee.co.th',
    team: 'Admin',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '12',
    name: 'Sam',
    email: 'sam@fairdee.co.th',
    team: 'Admin',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '13',
    name: 'Tina',
    email: 'tina@fairdee.co.th',
    team: 'Admin',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  // Delivery team
  {
    id: '14',
    name: 'Dao',
    email: 'dao@fairdee.co.th',
    team: 'Delivery',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '15',
    name: 'Kai',
    email: 'kai@fairdee.co.th',
    team: 'Delivery',
    startTime: '09:00:00',
    endTime: '12:00:00',
    shift2StartTime: '13:00:00',
    shift2EndTime: '18:00:00',
  },
  {
    id: '16',
    name: 'Ploy',
    email: 'ploy@fairdee.co.th',
    team: 'Delivery',
    startTime: '09:00:00',
    endTime: '12:30:00',
    shift2StartTime: '13:30:00',
    shift2EndTime: '18:00:00',
  },
];

export const defaultTeams = ['AST RF', 'AST SC', 'DE', 'Admin', 'Delivery'];
