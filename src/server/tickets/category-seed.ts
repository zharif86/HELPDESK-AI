/** Seed catalogue for Phase 2. Codes are stable keys for upserts. */
export const CATEGORY_SEED: Array<{
  code: string;
  name: string;
  description?: string;
  parentCode?: string;
  sortOrder: number;
}> = [
  { code: "HARDWARE", name: "Hardware", description: "Physical computing devices and peripherals.", sortOrder: 10 },
  { code: "DESKTOP", name: "Desktop Computer", parentCode: "HARDWARE", sortOrder: 11 },
  { code: "LAPTOP", name: "Laptop", parentCode: "HARDWARE", sortOrder: 12 },
  { code: "PRINTER", name: "Printer", parentCode: "HARDWARE", sortOrder: 13 },
  { code: "SCANNER", name: "Scanner", parentCode: "HARDWARE", sortOrder: 14 },
  { code: "PROJECTOR", name: "Projector and Display", parentCode: "HARDWARE", sortOrder: 15 },
  { code: "OS", name: "Operating System", description: "Desktop and laptop operating system issues.", sortOrder: 20 },
  { code: "SOFTWARE", name: "Software", description: "Application and productivity software.", sortOrder: 30 },
  { code: "MS_OFFICE", name: "Microsoft Office", parentCode: "SOFTWARE", sortOrder: 31 },
  { code: "MS_OUTLOOK", name: "Microsoft Outlook", parentCode: "SOFTWARE", sortOrder: 32 },
  { code: "MS_365", name: "Microsoft 365", parentCode: "SOFTWARE", sortOrder: 33 },
  { code: "EMAIL", name: "Email", parentCode: "SOFTWARE", sortOrder: 34 },
  { code: "VIDEO_CONF", name: "Video Conferencing", parentCode: "SOFTWARE", sortOrder: 35 },
  { code: "NETWORK", name: "Network", description: "Connectivity and network infrastructure.", sortOrder: 40 },
  { code: "LAN", name: "LAN", parentCode: "NETWORK", sortOrder: 41 },
  { code: "WIFI", name: "Wi-Fi", parentCode: "NETWORK", sortOrder: 42 },
  { code: "INTERNET", name: "Internet Connectivity", parentCode: "NETWORK", sortOrder: 43 },
  { code: "ROUTER_SWITCH", name: "Router and Switch", parentCode: "NETWORK", sortOrder: 44 },
  { code: "FIREWALL_VPN", name: "Firewall and VPN", parentCode: "NETWORK", sortOrder: 45 },
  { code: "STORAGE", name: "Storage and Backup", description: "Shared storage, file servers, and backups.", sortOrder: 50 },
  { code: "SHARED_FOLDER", name: "Shared Folder", parentCode: "STORAGE", sortOrder: 51 },
  { code: "FILE_SERVER", name: "File Server", parentCode: "STORAGE", sortOrder: 52 },
  { code: "IDENTITY", name: "User Account", description: "Accounts, passwords, and directory services.", sortOrder: 60 },
  { code: "PASSWORD_ACCESS", name: "Password and Access", parentCode: "IDENTITY", sortOrder: 61 },
  { code: "ACTIVE_DIRECTORY", name: "Active Directory", parentCode: "IDENTITY", sortOrder: 62 },
  { code: "INFRA", name: "Server and Infrastructure", description: "Servers and supporting infrastructure.", sortOrder: 70 },
  { code: "SECURITY", name: "Cybersecurity", description: "Security incidents and endpoint protection.", sortOrder: 80 },
  { code: "MALWARE", name: "Malware and Virus", parentCode: "SECURITY", sortOrder: 81 },
  { code: "ENDPOINT_SEC", name: "Endpoint Security", parentCode: "SECURITY", sortOrder: 82 },
  { code: "OTHER", name: "Other IT Issues", description: "Incidents that do not fit another category.", sortOrder: 90 },
];
