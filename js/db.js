/* LocalStorage Database Service for Project Dashboard - Version 3 */

const DB_KEY = 'PROJECT_DASHBOARD_DB_V3'; // New key for version 3 data structure

const DEFAULT_DELIVERABLES = [
  { name: 'Survey Reports', hours: 4, checked: false },
  { name: 'PV Layout', hours: 4, checked: false },
  { name: 'Single Line Diagram', hours: 4, checked: false },
  { name: 'PVSyst Simulation', hours: 4, checked: false },
  { name: 'Bill of Quantities (BOQ)', hours: 4, checked: false },
  { name: 'Load Profile Analysis', hours: 4, checked: false }
];

// Default mock data to populate if database is empty
const DEFAULT_DB = {
  projects: [
    {
      id: 'P-004',
      code: 'G26-004',
      name: 'Solar Carpark Fashion Island',
      region: 'Central',
      engineer: 'M-004', // Wannapa
      businessType: 'EPC',
      investor: 'GC',
      client: 'Land and Houses',
      systems: { Carpark: 1.8 },
      capacity: 1.8,
      lat: 13.8248,
      lng: 100.6782,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1224',
      image: 'https://images.unsplash.com/photo-1594818379496-da1e345b06a9?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'การติดตั้งหลังคาลานจอดรถพลังงานแสงอาทิตย์บริเวณห้างสรรพสินค้าแฟชั่นไอส์แลนด์ ช่วยบังแดดและผลิตไฟฟ้าใช้ภายในศูนย์การค้า',
      status: 'In Progress',
      stage: 'Underdevelop',
      deadline: '2026-10-30'
    },
    {
      id: 'P-005',
      code: 'G26-005',
      name: 'BESS Microgrid Koh Samui',
      region: 'South',
      engineer: 'M-001', // Somchai
      businessType: 'EPC',
      investor: 'Other',
      client: 'Samui Resort Association',
      systems: { BESS: 5.0 },
      capacity: 5.0,
      lat: 9.5120,
      lng: 100.0136,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1225',
      image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'ระบบกักเก็บพลังงานแบตเตอรี่ (BESS) ขนาด 5 MWh ร่วมกับโครงข่ายไฟฟ้าย่อย เพื่อเพิ่มความเสถียรในการจ่ายกระแสไฟฟ้าบนเกาะสมุย',
      status: 'Standby',
      stage: 'Underdevelop',
      deadline: '2026-11-15'
    },
    {
      id: 'P-007',
      code: 'G26-007',
      name: 'Solar Farm Chiang Mai Agri',
      region: 'North',
      engineer: 'M-002', // คุณแก๊ง
      businessType: 'PPA',
      investor: 'GPSC',
      client: 'Northern Agriculture Ltd',
      systems: { Farm: 8.5 },
      capacity: 8.5,
      lat: 18.7883,
      lng: 98.9853,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1227',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'ฟาร์มแสงอาทิตย์ขนาด 8.5 MWp ในเชียงใหม่ สนับสนุนกลุ่มการเกษตรในพื้นที่ด้วยการแบ่งปันพื้นที่ติดตั้งโซลาร์และทำการเกษตรควบคู่กัน',
      status: 'In Progress',
      stage: 'Underdevelop',
      deadline: '2027-02-15'
    },
    {
      id: 'P-008',
      code: 'G26-008',
      name: 'Hybrid Floating & Carpark Rayong',
      region: 'East',
      engineer: 'M-004', // Wannapa
      businessType: 'PPA',
      investor: 'PTT',
      client: 'Amata City Rayong',
      systems: { Floating: 15.0, Carpark: 2.5 },
      capacity: 17.5,
      lat: 13.0125,
      lng: 101.1963,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1228',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'ระบบพลังงานแสงอาทิตย์แบบผสมผสาน (Hybrid) โดยรวมเทคโนโลยีทุ่นลอยน้ำ 15 MWp และหลังคาลานจอดรถของนิคมอุตสาหกรรมอมตะระยอง 2.5 MWp',
      status: 'Standby',
      stage: 'Underdevelop',
      deadline: '2026-09-01'
    }
  ],
  awardedProjects: [
    {
      id: 'P-001',
      code: 'G26-001',
      name: 'Solar Rooftop Siam Cement (Rayong)',
      region: 'East',
      engineer: 'M-001', // Somchai
      businessType: 'PPA',
      investor: 'OR',
      client: 'Siam Cement Group',
      systems: { Rooftop: 3.5 },
      capacity: 3.5,
      lat: 12.6828,
      lng: 101.2813,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1221',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'โครงการติดตั้งพลังงานแสงอาทิตย์บนหลังคาพื้นที่โรงงานระยอง มีพื้นที่หลังคาประมาณ 15,000 ตารางเมตร',
      status: 'Complete',
      stage: 'Award',
      deadline: '2026-08-15',
      constructionDate: '2026-06-15',
      codDate: '2026-08-15',
      prTest: 'PR 82%',
      pv: 'Jinko 580W',
      inverter: 'Huawei 110kW',
      awardNote: 'First awarded project of the year.'
    },
    {
      id: 'P-002',
      code: 'G26-002',
      name: 'Solar Farm Korat Clean Energy',
      region: 'Northeast',
      engineer: 'M-002', // คุณแก๊ง
      businessType: 'EPC',
      investor: 'GPSC',
      client: 'Korat Energy Corp',
      systems: { Farm: 12.0 },
      capacity: 12.0,
      lat: 14.9799,
      lng: 102.0979,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1222',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'ฟาร์มโซลาร์เซลล์ขนาดใหญ่ในจังหวัดนครราชสีมา กำลังการผลิตรวม 12 MWp จ่ายไฟเข้าระบบการไฟฟ้าส่วนภูมิภาค',
      status: 'In Progress',
      stage: 'Award',
      deadline: '2026-12-20',
      constructionDate: '2026-07-01',
      codDate: '2026-12-20',
      prTest: 'PR 83%',
      pv: 'Longi 585W',
      inverter: 'Sungrow 125kW',
      awardNote: 'EPC Solar Farm project.'
    },
    {
      id: 'P-003',
      code: 'G26-003',
      name: 'Floating Solar Sirindhorn Reservoir',
      region: 'Northeast',
      engineer: 'M-003', // Piyapong
      businessType: 'PPA',
      investor: 'PTT',
      client: 'EGAT',
      systems: { Floating: 45.0 },
      capacity: 45.0,
      lat: 15.2089,
      lng: 105.4194,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1223',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'โครงการโซลาร์ลอยน้ำเขื่อนสิรินธร เป็นการผสานพลังงานไฮบริดร่วมกับโรงไฟฟ้าพลังน้ำเขื่อนสิรินธร',
      status: 'Complete',
      stage: 'Award',
      deadline: '2026-05-10',
      constructionDate: '2026-01-15',
      codDate: '2026-05-10',
      prTest: 'PR 84%',
      pv: 'Trina 590W',
      inverter: 'Solis 110kW',
      awardNote: 'Largest floating hybrid project.'
    },
    {
      id: 'P-006',
      code: 'G26-006',
      name: 'Solar Rooftop Factory Gateway',
      region: 'East',
      engineer: 'M-003', // Piyapong
      businessType: 'Treading',
      investor: 'OR',
      client: 'Gateway Industrial Estate',
      systems: { Rooftop: 0.95 },
      capacity: 0.95,
      lat: 13.5936,
      lng: 101.3857,
      googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1226',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60',
      deliverables: JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: 'โครงการโซลาร์รูฟท็อปขนาด 950 kWp สำหรับโรงงานอุตสาหกรรมในนิคมเกตเวย์ซิตี้ ผลิตกระแสไฟฟ้าเพื่อใช้ในสายการผลิตเวลากลางวัน',
      status: 'Complete',
      stage: 'Award',
      deadline: '2026-03-25',
      constructionDate: '2026-02-01',
      codDate: '2026-03-25',
      prTest: 'PR 81%',
      pv: 'JA Solar 575W',
      inverter: 'SMA 100kW',
      awardNote: 'Factory rooftop trading contract.'
    }
  ],
  members: [
    { id: 'M-001', name: 'Somchai Yodwitsawakon', role: 'Senior BD Engineer' },
    { id: 'M-002', name: 'คุณแก๊ง (Gung)', role: 'BD Engineer' },
    { id: 'M-003', name: 'Piyapong Ngedee', role: 'Project BD Manager' },
    { id: 'M-004', name: 'Wannapa Wongkantra', role: 'Business Development' }
  ],
  holidays: [
    { id: 'H-001', date: '2026-01-01', name: 'New Year\'s Day' },
    { id: 'H-002', date: '2026-04-13', name: 'Songkran Festival' },
    { id: 'H-003', date: '2026-04-14', name: 'Songkran Festival' },
    { id: 'H-004', date: '2026-04-15', name: 'Songkran Festival' },
    { id: 'H-005', date: '2026-05-01', name: 'National Labour Day' },
    { id: 'H-006', date: '2026-06-03', name: 'H.M. Queen Suthida\'s Birthday' },
    { id: 'H-007', date: '2026-07-28', name: 'H.M. King Maha Vajiralongkorn\'s Birthday' },
    { id: 'H-008', date: '2026-10-13', name: 'King Bhumibol Adulyadej Memorial Day' },
    { id: 'H-009', date: '2026-12-05', name: 'King Bhumibol\'s Birthday (Father\'s Day)' },
    { id: 'H-010', date: '2026-12-31', name: 'New Year\'s Eve' }
  ],
  manhours: [
    { id: 'MH-001', memberId: 'M-001', date: '2026-06-01', hours: 8, projectId: 'P-001' },
    { id: 'MH-002', memberId: 'M-001', date: '2026-06-02', hours: 7, projectId: 'P-001' },
    { id: 'MH-003', memberId: 'M-001', date: '2026-06-03', hours: 8, projectId: 'P-005' },
    { id: 'MH-004', memberId: 'M-001', date: '2026-06-04', hours: 8, projectId: 'P-005' },
    { id: 'MH-005', memberId: 'M-001', date: '2026-06-05', hours: 8, projectId: 'P-001' },
    
    { id: 'MH-006', memberId: 'M-002', date: '2026-06-01', hours: 8, projectId: 'P-002' },
    { id: 'MH-007', memberId: 'M-002', date: '2026-06-02', hours: 8, projectId: 'P-002' },
    { id: 'MH-008', memberId: 'M-002', date: '2026-06-03', hours: 6, projectId: 'P-007' },
    { id: 'MH-009', memberId: 'M-002', date: '2026-06-04', hours: 8, projectId: 'P-007' },
    { id: 'MH-010', memberId: 'M-002', date: '2026-06-05', hours: 9, projectId: 'P-002' },
    
    { id: 'MH-011', memberId: 'M-003', date: '2026-06-01', hours: 6, projectId: 'P-003' },
    { id: 'MH-012', memberId: 'M-003', date: '2026-06-02', hours: 8, projectId: 'P-003' },
    { id: 'MH-013', memberId: 'M-003', date: '2026-06-03', hours: 8, projectId: 'P-006' },
    { id: 'MH-014', memberId: 'M-003', date: '2026-06-04', hours: 7, projectId: 'P-006' },
    { id: 'MH-015', memberId: 'M-003', date: '2026-06-05', hours: 8, projectId: 'P-003' },
    
    { id: 'MH-016', memberId: 'M-004', date: '2026-06-01', hours: 8, projectId: 'P-004' },
    { id: 'MH-017', memberId: 'M-004', date: '2026-06-02', hours: 8, projectId: 'P-004' },
    { id: 'MH-018', memberId: 'M-004', date: '2026-06-03', hours: 8, projectId: 'P-008' },
    { id: 'MH-019', memberId: 'M-004', date: '2026-06-04', hours: 8, projectId: 'P-008' },
    { id: 'MH-020', memberId: 'M-004', date: '2026-06-05', hours: 8, projectId: 'P-004' }
  ]
};

// Stable JSON stringifier helper to avoid order mismatch false-positives
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

// Database controller class
class LocalDatabase {
  constructor() {
    this.data = null;
    this.lastSaveTime = 0;
    this.isSaving = false;
    this.init();
    this.startRealtimeSync();
  }

  getGasUrl() {
    return localStorage.getItem('PROJECT_DASHBOARD_GAS_URL') || '';
  }

  setGasUrl(url) {
    if (url) {
      localStorage.setItem('PROJECT_DASHBOARD_GAS_URL', url.trim());
    } else {
      localStorage.removeItem('PROJECT_DASHBOARD_GAS_URL');
    }
  }

  startRealtimeSync() {
    setInterval(() => {
      // Cooldown period or saving in progress: skip sync
      if (this.isSaving) {
        console.log('Skipping real-time sync: save in progress');
        return;
      }
      if (this.lastSaveTime && (Date.now() - this.lastSaveTime < 15000)) {
        console.log('Skipping real-time sync: within cooldown period after save');
        return;
      }
      
      const gasUrl = this.getGasUrl();
      if (gasUrl) {
        const url = gasUrl.indexOf('?') !== -1 ? `${gasUrl}&action=get` : `${gasUrl}?action=get`;
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return res.json();
          })
          .then(serverDb => {
            if (serverDb && (serverDb.projects || serverDb.awardedProjects)) {
              const currentStr = stableStringify(this.data);
              const serverStr = stableStringify(serverDb);
              if (currentStr !== serverStr) {
                console.log('Database updated from server, refreshing views...');
                this.data = serverDb;
                this.patchAndMigrate();
                localStorage.setItem(DB_KEY, JSON.stringify(this.data));
                if (window.app && typeof window.app.updateViews === 'function') {
                  window.app.updateViews();
                }
              }
            }
          })
          .catch(e => {
            console.error('Real-time sync fetch failed:', e);
          });
      }
    }, 15000); // Sync every 15 seconds
  }

  // Initial load
  init() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        this.save();
      }

      this.patchAndMigrate();

      const gasUrl = this.getGasUrl();
      if (gasUrl) {
        this.fetchFromServer(gasUrl);
      }
    } catch (e) {
      console.error('Failed to parse database, resetting to default.', e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
      this.save();
    }
  }

  patchAndMigrate() {
    if (!this.data.projects) this.data.projects = [];
    if (!this.data.awardedProjects) this.data.awardedProjects = [];
    if (!this.data.members) this.data.members = [];
    if (!this.data.holidays) this.data.holidays = [];
    if (!this.data.manhours) this.data.manhours = [];
    if (!this.data.calendarNotes) this.data.calendarNotes = [];

    let migrated = false;

    const migrateProjectFields = (p) => {
      // 1. Systems
      if (typeof p.systems === 'string' && p.systems.trim() !== '') {
        try {
          p.systems = JSON.parse(p.systems);
          migrated = true;
        } catch (e) {
          p.systems = {};
          migrated = true;
        }
      }
      if (!p.systems || typeof p.systems !== 'object') {
        p.systems = {};
        migrated = true;
      }

      // 2. Deliverables
      if (typeof p.deliverables === 'string' && p.deliverables.trim() !== '') {
        try {
          p.deliverables = JSON.parse(p.deliverables);
          migrated = true;
        } catch (e) {
          p.deliverables = [];
          migrated = true;
        }
      }
      if (!Array.isArray(p.deliverables)) {
        p.deliverables = [];
        migrated = true;
      }
      if (p.deliverables.length === 0) {
        p.deliverables = JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES));
        migrated = true;
      }

      // 3. Revisions
      if (typeof p.revisions === 'string' && p.revisions.trim() !== '') {
        try {
          p.revisions = JSON.parse(p.revisions);
          migrated = true;
        } catch (e) {
          p.revisions = [];
          migrated = true;
        }
      }
      if (!Array.isArray(p.revisions)) {
        p.revisions = [];
        migrated = true;
      }
      
      // Migrate older stage strings if any
      if (p.stage === 'Awarded') {
        p.stage = 'Award';
        migrated = true;
      }
      if (p.stage === 'Underdevelopment') {
        p.stage = 'Underdevelop';
        migrated = true;
      }

      // Recalculate capacity excluding BESS
      const sysObj = p.systems || {};
      const solarCapacity = Object.entries(sysObj)
        .filter(([sys]) => sys !== 'BESS')
        .reduce((sum, [_, cap]) => sum + (parseFloat(cap) || 0), 0);
      
      if (p.capacity !== solarCapacity) {
        p.capacity = solarCapacity;
        migrated = true;
      }
    };

    this.data.projects.forEach(migrateProjectFields);
    this.data.awardedProjects.forEach(migrateProjectFields);

    // Partition projects by stage
    const pipelineProjects = [];
    const awardedProjects = [];

    this.data.projects.forEach(p => {
      if (p.stage === 'Award') {
        awardedProjects.push(p);
        migrated = true;
      } else {
        pipelineProjects.push(p);
      }
    });

    this.data.awardedProjects.forEach(p => {
      if (p.stage === 'Award') {
        awardedProjects.push(p);
      } else {
        pipelineProjects.push(p);
        migrated = true;
      }
    });

    if (migrated) {
      this.data.projects = pipelineProjects;
      this.data.awardedProjects = awardedProjects;
      this.save();
    }
  }

  fetchFromServer(gasUrl, force = false) {
    const url = gasUrl.indexOf('?') !== -1 ? `${gasUrl}&action=get` : `${gasUrl}?action=get`;
    return fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(serverDb => {
        if (serverDb && (serverDb.projects || serverDb.awardedProjects)) {
          const currentStr = stableStringify(this.data);
          const serverStr = stableStringify(serverDb);
          if (force || currentStr !== serverStr) {
            console.log('Database synced from server, updating UI...');
            this.data = serverDb;
            this.patchAndMigrate();
            localStorage.setItem(DB_KEY, JSON.stringify(this.data));
            if (window.app && typeof window.app.updateViews === 'function') {
              window.app.updateViews();
            }
          }
          return serverDb;
        }
        throw new Error('Invalid database object returned from server');
      })
      .catch(e => {
        console.error('Failed to fetch database from GAS API:', e);
        throw e;
      });
  }

  // Save current state to LocalStorage and remote GAS API if configured
  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));

      const gasUrl = this.getGasUrl();
      if (gasUrl) {
        this.isSaving = true;
        if (window.app && typeof window.app.updateSyncWidgets === 'function') {
          window.app.updateSyncWidgets();
        }
        const url = gasUrl.indexOf('?') !== -1 ? `${gasUrl}&action=save` : `${gasUrl}?action=save`;
        fetch(url, {
          method: 'POST',
          body: JSON.stringify(this.data)
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(serverDb => {
          if (serverDb && (serverDb.projects || serverDb.awardedProjects)) {
            console.log('Database saved and synced back from server successfully.');
            this.data = serverDb;
            this.patchAndMigrate();
            localStorage.setItem(DB_KEY, JSON.stringify(this.data));
            if (window.app && typeof window.app.updateViews === 'function') {
              window.app.updateViews();
            }
          } else {
            console.warn('Server saved successfully but did not return valid database object.');
          }
          this.isSaving = false;
          this.lastSaveTime = Date.now();
          if (window.app && typeof window.app.updateSyncWidgets === 'function') {
            window.app.updateSyncWidgets();
          }
        })
        .catch(e => {
          console.error('Failed to sync save to GAS API:', e);
          this.isSaving = false;
          this.lastSaveTime = Date.now();
          if (window.app && typeof window.app.updateSyncWidgets === 'function') {
            window.app.updateSyncWidgets();
          }
        });
      } else {
        this.lastSaveTime = Date.now();
        if (window.app && typeof window.app.updateSyncWidgets === 'function') {
          window.app.updateSyncWidgets();
        }
      }
    } catch (e) {
      console.error('Failed to save database', e);
    }
  }

  // --- Projects CRUD ---
  getProjects() {
    return this.data.projects || [];
  }

  getAwardedProjects() {
    return this.data.awardedProjects || [];
  }

  getProject(id) {
    let p = this.data.projects.find(p => p.id === id);
    if (!p && this.data.awardedProjects) {
      p = this.data.awardedProjects.find(p => p.id === id);
    }
    return p;
  }

  // Auto-generation of next G26-XXX code
  generateNextProjectCode() {
    const yearPrefix = 'G26-';
    const allProjects = [
      ...(this.data.projects || []),
      ...(this.data.awardedProjects || [])
    ];
    const codes = allProjects
      .map(p => p.code)
      .filter(code => code && code.startsWith(yearPrefix));
    
    let maxNum = 0;
    codes.forEach(c => {
      const numPart = c.split('-')[1];
      if (numPart) {
        const val = parseInt(numPart);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    });

    const nextVal = maxNum + 1;
    return `${yearPrefix}${String(nextVal).padStart(3, '0')}`;
  }

  addProject(project) {
    const newId = 'P-' + String(Date.now()).slice(-6);
    
    // Auto run code G26-XXX
    const projectCode = this.generateNextProjectCode();
    
    // Calculate total capacity (excluding BESS)
    const sysObj = project.systems || {};
    const totalCapacity = Object.entries(sysObj)
      .filter(([sys]) => sys !== 'BESS')
      .reduce((sum, [_, cap]) => sum + (parseFloat(cap) || 0), 0);

    const newProject = {
      id: newId,
      code: projectCode,
      name: project.name || 'Unnamed Project',
      region: project.region || 'Central',
      engineer: project.engineer || '',
      businessType: project.businessType || 'EPC',
      investor: project.investor || 'Other',
      client: project.client || '',
      systems: sysObj,
      capacity: totalCapacity,
      lat: (project.lat !== null && project.lat !== undefined && !isNaN(project.lat)) ? parseFloat(project.lat) : null,
      lng: (project.lng !== null && project.lng !== undefined && !isNaN(project.lng)) ? parseFloat(project.lng) : null,
      googleMapsLink: project.googleMapsLink || '',
      image: project.image || '',
      deliverables: project.deliverables || JSON.parse(JSON.stringify(DEFAULT_DELIVERABLES)),
      notes: project.notes || '',
      status: project.status || 'Standby',
      stage: project.stage || 'Underdevelop',
      deadline: project.deadline || new Date().toISOString().split('T')[0],
      constructionDate: project.constructionDate || '',
      codDate: project.codDate || '',
      prTest: project.prTest || '',
      pv: project.pv || '',
      inverter: project.inverter || '',
      awardNote: project.awardNote || '',
      revisions: project.revisions || []
    };
    
    if (newProject.stage === 'Award') {
      if (!this.data.awardedProjects) this.data.awardedProjects = [];
      this.data.awardedProjects.push(newProject);
    } else {
      if (!this.data.projects) this.data.projects = [];
      this.data.projects.push(newProject);
    }
    this.save();
    return newProject;
  }

  updateProject(id, updatedData) {
    let listName = 'projects';
    let idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) {
      if (!this.data.awardedProjects) this.data.awardedProjects = [];
      idx = this.data.awardedProjects.findIndex(p => p.id === id);
      listName = 'awardedProjects';
    }
    if (idx === -1) return false;

    const currentProject = this.data[listName][idx];
    const sysObj = updatedData.systems || currentProject.systems || {};
    const totalCapacity = Object.entries(sysObj)
      .filter(([sys]) => sys !== 'BESS')
      .reduce((sum, [_, cap]) => sum + (parseFloat(cap) || 0), 0);

    const updatedProject = {
      ...currentProject,
      ...updatedData,
      systems: sysObj,
      capacity: totalCapacity,
      lat: updatedData.hasOwnProperty('lat') ? (updatedData.lat === null || isNaN(updatedData.lat) ? null : parseFloat(updatedData.lat)) : currentProject.lat,
      lng: updatedData.hasOwnProperty('lng') ? (updatedData.lng === null || isNaN(updatedData.lng) ? null : parseFloat(updatedData.lng)) : currentProject.lng
    };

    // Check if stage changed between Award and non-Award
    const oldStage = currentProject.stage;
    const newStage = updatedProject.stage || oldStage;

    if (oldStage === 'Award' && newStage !== 'Award') {
      // Move from awardedProjects to projects
      this.data.awardedProjects.splice(idx, 1);
      if (!this.data.projects) this.data.projects = [];
      this.data.projects.push(updatedProject);
    } else if (oldStage !== 'Award' && newStage === 'Award') {
      // Move from projects to awardedProjects
      this.data.projects.splice(idx, 1);
      if (!this.data.awardedProjects) this.data.awardedProjects = [];
      this.data.awardedProjects.push(updatedProject);
    } else {
      // Keep in same list
      this.data[listName][idx] = updatedProject;
    }

    this.save();
    return updatedProject;
  }

  deleteProject(id) {
    const initialLen1 = this.data.projects.length;
    const initialLen2 = this.data.awardedProjects ? this.data.awardedProjects.length : 0;
    
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    if (this.data.awardedProjects) {
      this.data.awardedProjects = this.data.awardedProjects.filter(p => p.id !== id);
    }
    
    // Clean up manhours
    this.data.manhours = this.data.manhours.filter(mh => mh.projectId !== id);
    
    this.save();
    return this.data.projects.length < initialLen1 || (this.data.awardedProjects && this.data.awardedProjects.length < initialLen2);
  }

  // --- Members CRUD ---
  getMembers() {
    return this.data.members || [];
  }

  addMember(name, role) {
    const newId = 'M-' + String(Date.now()).slice(-6);
    const newMember = { id: newId, name, role };
    if (!this.data.members) this.data.members = [];
    this.data.members.push(newMember);
    this.save();
    return newMember;
  }

  deleteMember(id) {
    const initialLen = this.data.members ? this.data.members.length : 0;
    this.data.members = (this.data.members || []).filter(m => m.id !== id);
    
    // Unassign this member from both projects lists
    const allProjects = [
      ...(this.data.projects || []),
      ...(this.data.awardedProjects || [])
    ];
    allProjects.forEach(p => {
      if (p.engineer === id) {
        this.updateProject(p.id, { engineer: '' });
      }
    });

    // Clean up manhours
    this.data.manhours = (this.data.manhours || []).filter(mh => mh.memberId !== id);

    this.save();
    return this.data.members.length < initialLen;
  }

  // --- Holidays CRUD ---
  getHolidays() {
    return this.data.holidays || [];
  }

  addHoliday(date, name) {
    const newId = 'H-' + String(Date.now()).slice(-6);
    const newHoliday = { id: newId, date, name };
    if (!this.data.holidays) this.data.holidays = [];
    this.data.holidays.push(newHoliday);
    this.data.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.save();
    return newHoliday;
  }

  deleteHoliday(id) {
    const initialLen = this.data.holidays ? this.data.holidays.length : 0;
    this.data.holidays = (this.data.holidays || []).filter(h => h.id !== id);
    this.save();
    return this.data.holidays.length < initialLen;
  }

  // --- Calendar Notes CRUD ---
  getCalendarNotes() {
    if (!this.data.calendarNotes) this.data.calendarNotes = [];
    return this.data.calendarNotes;
  }

  saveCalendarNote(date, note) {
    if (!this.data.calendarNotes) this.data.calendarNotes = [];
    const idx = this.data.calendarNotes.findIndex(n => n.date === date);
    
    if (note.trim() === '') {
      if (idx !== -1) {
        this.data.calendarNotes.splice(idx, 1);
      }
    } else {
      if (idx !== -1) {
        this.data.calendarNotes[idx].note = note;
      } else {
        const newId = 'N-' + String(Date.now()).slice(-6);
        this.data.calendarNotes.push({ id: newId, date, note });
      }
    }
    this.save();
  }

  // --- Manhours Management ---
  getManhours() {
    return this.data.manhours || [];
  }

  saveManhour(memberId, date, hours, projectId = '', deliverableName = '') {
    if (!this.data.manhours) this.data.manhours = [];
    const entry = this.data.manhours.find(mh => mh.memberId === memberId && mh.date === date && mh.projectId === projectId && (mh.deliverableName || '') === deliverableName);
    
    if (entry) {
      if (hours <= 0) {
        this.data.manhours = this.data.manhours.filter(mh => mh.id !== entry.id);
      } else {
        entry.hours = parseFloat(hours) || 0;
      }
    } else if (hours > 0) {
      const newId = 'MH-' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 100));
      this.data.manhours.push({
        id: newId,
        memberId,
        date,
        hours: parseFloat(hours) || 0,
        projectId,
        deliverableName
      });
    }
    this.save();
  }

  // Helper: Get weekly hours for all members
  getWeeklyManhoursSummary(startDateStr) {
    const start = new Date(startDateStr);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }

    const summary = {};
    const members = this.getMembers();
    
    members.forEach(m => {
      summary[m.id] = {
        memberId: m.id,
        memberName: m.name,
        dailyHours: {},
        weeklyTotal: 0
      };
      days.forEach(day => {
        summary[m.id].dailyHours[day] = 0;
      });
    });

    const manhours = this.getManhours();
    manhours.forEach(mh => {
      if (summary[mh.memberId] && days.includes(mh.date)) {
        summary[mh.memberId].dailyHours[mh.date] += mh.hours;
        summary[mh.memberId].weeklyTotal += mh.hours;
      }
    });

    return {
      days,
      summary: Object.values(summary)
    };
  }

  // --- Export / Import Backup JSON ---
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        if ((parsed.projects || parsed.awardedProjects) && parsed.members && parsed.holidays && parsed.manhours) {
          this.data = parsed;
          if (!this.data.calendarNotes) this.data.calendarNotes = [];
          this.patchAndMigrate();
          this.save();
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  }
}

// Instantiate database globally
const db = new LocalDatabase();
window.db = db;

// Global capacity formatting helpers
window.formatProjectCapacityRow = function(p) {
  let parts = [];
  const solarCap = p.capacity || 0; // already excludes BESS
  if (solarCap > 0) {
    parts.push(`${(solarCap * 1000).toLocaleString(undefined, {maximumFractionDigits: 0})} kWp`);
  }
  if (p.systems && p.systems.BESS && parseFloat(p.systems.BESS) > 0) {
    const bessCap = parseFloat(p.systems.BESS);
    parts.push(`${(bessCap * 1000).toLocaleString(undefined, {maximumFractionDigits: 0})} kWh`);
  }
  return parts.length > 0 ? parts.join(' + ') : '0 kWp';
};

window.formatProjectCapacityMW = function(p) {
  let parts = [];
  const solarCap = p.capacity || 0; // already excludes BESS
  if (solarCap > 0) {
    parts.push(`${solarCap.toFixed(1)} MW`);
  }
  if (p.systems && p.systems.BESS && parseFloat(p.systems.BESS) > 0) {
    const bessCap = parseFloat(p.systems.BESS);
    parts.push(`${bessCap.toFixed(1)} MW (BESS)`);
  }
  return parts.length > 0 ? parts.join(' + ') : '0.0 MW';
};
