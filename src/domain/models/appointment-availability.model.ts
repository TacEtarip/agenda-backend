export enum AppointmentAvailabilitySource {
  AGENDA = 'agenda',
  GOOGLE = 'google',
}

export interface AppointmentBusyInterval {
  source: AppointmentAvailabilitySource;
  startTime: Date;
  endTime: Date;
  appointmentId?: string;
}

export interface AppointmentAvailabilityResult {
  available: boolean;
  externalCalendarChecked: boolean;
  conflicts: AppointmentBusyInterval[];
}

export interface AppointmentAvailabilityInput {
  userId: string;
  companyId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}
