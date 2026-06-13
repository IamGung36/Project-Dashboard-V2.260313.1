/* Main Application Script - English Scheme with SVG Map Markers & Multiple Systems */

// Define global map callback at the very top to avoid race conditions
window.initMapsGlobal = function() {
  if (window.app) {
    window.app.initMaps();
  } else {
    // Retry if app is not yet instantiated
    setTimeout(() => {
      if (window.app) {
        window.app.initMaps();
      }
    }, 100);
  }
};

class DashboardApp {
  constructor() {
    this.activePage = 'portfolio';
    this.portfolioMap = null;
    this.overviewMap = null;
    this.portfolioMarkers = [];
    this.overviewMarkers = [];
    this.portfolioCharts = {};
    this.overviewCharts = {};
    
    this.thailandCenter = { lat: 13.7563, lng: 100.5018 };
    
    // Custom Deep Green map styles matching PTT green theme
    this.lightMapStyle = [
      { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#4bbcd3" }] },
      { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#d5f3e5" }] },
      { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
      { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#abeac5" }] },
      { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#d1eedb" }] }
    ];
    this.darkMapStyle = [
      { "elementType": "geometry", "stylers": [{ "color": "#08130d" }] },
      { "elementType": "labels.text.stroke", "stylers": [{ "color": "#08130d" }] },
      { "elementType": "labels.text.fill", "stylers": [{ "color": "#768c7e" }] },
      { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#010804" }] },
      { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#112117" }] }
    ];
    this.currentEditProjectAwardData = {};
    this.currentAddProjectAwardData = {
      constructionDate: '',
      codDate: '',
      prTest: '',
      pv: '',
      inverter: '',
      awardNote: ''
    };
    this.addProjectPreviousStage = 'Underdevelop';
    this.editProjectPreviousStage = 'Underdevelop';
  }

  // Generate a modern, glowing SVG pin icon dynamically
  getPinIconSvg(color) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">' +
      '<defs>' +
        '<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="black" flood-opacity="0.35"/>' +
        '</filter>' +
      '</defs>' +
      '<path fill="' + color + '" stroke="#ffffff" stroke-width="1.8" filter="url(#glow)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' +
    '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy
    }
    return dateStr;
  }

  // Helper to parse coordinates from single text input "lat, lng" or Google Maps link
  parseCoordinates(inputStr, mapsLink) {
    if (inputStr) {
      let parts = inputStr.split(',');
      if (parts.length !== 2) {
        parts = inputStr.trim().split(/\s+/);
      }
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    if (mapsLink) {
      // Check for @lat,lng
      let match = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      
      // Check for q=lat,lng
      match = mapsLink.match(/[qQ]=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      
      // Check for ll=lat,lng
      match = mapsLink.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }

      // Check for place/lat,lng or place/lat+lng
      match = mapsLink.match(/place\/(-?\d+\.\d+)(?:,|\+)(-?\d+\.\d+)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }
    
    return { lat: null, lng: null };
  }

  init() {
    // Theme setup
    const savedTheme = localStorage.getItem('THEME') || 'light';
    this.setTheme(savedTheme);
    const themeCheckbox = document.getElementById('theme-toggle-switch');
    if (themeCheckbox) {
      themeCheckbox.checked = (savedTheme === 'dark');
      themeCheckbox.addEventListener('change', (e) => {
        this.setTheme(e.target.checked ? 'dark' : 'light');
      });
    }

    // SPA Link Binding
    const links = document.querySelectorAll('.menu-item-link, .bottom-nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        if (pageId) this.switchPage(pageId);
      });
    });

    // Setup toggling for Capacity Inputs in Add New Project Form
    ['Rooftop', 'Farm', 'Floating', 'Carpark', 'BESS'].forEach(sys => {
      const chk = document.getElementById(`project-system-${sys}`);
      const wrapper = document.getElementById(`project-capacity-${sys}-wrapper`);
      if (chk && wrapper) {
        chk.addEventListener('change', (e) => {
          wrapper.style.display = e.target.checked ? 'block' : 'none';
          if (!e.target.checked) {
            document.getElementById(`project-capacity-${sys}`).value = '';
          }
        });
      }

      // Same for Edit Project Form
      const editChk = document.getElementById(`edit-project-system-${sys}`);
      const editWrapper = document.getElementById(`edit-project-capacity-${sys}-wrapper`);
      if (editChk && editWrapper) {
        editChk.addEventListener('change', (e) => {
          editWrapper.style.display = e.target.checked ? 'block' : 'none';
          if (!e.target.checked) {
            document.getElementById(`edit-project-capacity-${sys}`).value = '';
          }
        });
      }
    });

    // Image upload listener to convert to Base64 in background
    const fileInput = document.getElementById('project-image-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            fileInput.setAttribute('data-base64', event.target.result);
          };
          reader.readAsDataURL(file);
        } else {
          fileInput.removeAttribute('data-base64');
        }
      });
    }
    
    const editFileInput = document.getElementById('edit-project-image-file');
    if (editFileInput) {
      editFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            editFileInput.setAttribute('data-base64', event.target.result);
          };
          reader.readAsDataURL(file);
        } else {
          editFileInput.removeAttribute('data-base64');
        }
      });
    }

    // Deliverables add item buttons
    const addProjDelBtn = document.getElementById('add-project-add-deliverable-btn');
    if (addProjDelBtn) {
      addProjDelBtn.addEventListener('click', () => {
        const delName = prompt('Enter Deliverable Name:');
        if (delName && delName.trim()) {
          this.appendDeliverableItem('add-project-deliverables-list', { name: delName.trim(), hours: 4, checked: false });
        }
      });
    }
    
    const editProjDelBtn = document.getElementById('edit-project-add-deliverable-btn');
    if (editProjDelBtn) {
      editProjDelBtn.addEventListener('click', () => {
        const delName = prompt('Enter Deliverable Name:');
        if (delName && delName.trim()) {
          this.appendDeliverableItem('edit-project-deliverables-list', { name: delName.trim(), hours: 4, checked: false });
        }
      });
    }

    // Custom Installation System type buttons
    const addProjSysBtn = document.getElementById('add-project-new-system-btn');
    if (addProjSysBtn) {
      addProjSysBtn.addEventListener('click', () => {
        const sysName = prompt('Enter System Type Name:');
        if (sysName && sysName.trim()) {
          this.appendCustomSystemItem('add-project-systems-container', sysName.trim());
        }
      });
    }

    const editProjSysBtn = document.getElementById('edit-project-new-system-btn');
    if (editProjSysBtn) {
      editProjSysBtn.addEventListener('click', () => {
        const sysName = prompt('Enter System Type Name:');
        if (sysName && sysName.trim()) {
          this.appendCustomSystemItem('edit-project-systems-container', sysName.trim());
        }
      });
    }

    // Add/Edit Stage Select and Award details buttons
    const projectStageSelect = document.getElementById('project-stage');
    const addAwardBtn = document.getElementById('add-award-details-btn');
    if (projectStageSelect) {
      projectStageSelect.addEventListener('change', (e) => {
        const newStage = e.target.value;
        if (newStage === 'Award') {
          this.showAwardDetailsModal(null, this.currentAddProjectAwardData, 
            (data) => {
              this.currentAddProjectAwardData = data;
              this.addProjectPreviousStage = 'Award';
              if (addAwardBtn) addAwardBtn.style.display = 'inline-block';
            },
            () => {
              projectStageSelect.value = this.addProjectPreviousStage;
              if (this.addProjectPreviousStage !== 'Award' && addAwardBtn) addAwardBtn.style.display = 'none';
            }
          );
        } else {
          this.addProjectPreviousStage = newStage;
          if (addAwardBtn) addAwardBtn.style.display = 'none';
        }
      });
    }

    if (addAwardBtn) {
      addAwardBtn.addEventListener('click', () => {
        this.showAwardDetailsModal(null, this.currentAddProjectAwardData, (data) => {
          this.currentAddProjectAwardData = data;
        });
      });
    }

    const editProjectStageSelect = document.getElementById('edit-project-stage');
    const editAwardBtn = document.getElementById('edit-award-details-btn');
    if (editProjectStageSelect) {
      editProjectStageSelect.addEventListener('change', (e) => {
        const newStage = e.target.value;
        if (newStage === 'Award') {
          this.showAwardDetailsModal(document.getElementById('edit-project-id').value, this.currentEditProjectAwardData,
            (data) => {
              this.currentEditProjectAwardData = data;
              this.editProjectPreviousStage = 'Award';
              if (editAwardBtn) editAwardBtn.style.display = 'inline-block';
            },
            () => {
              editProjectStageSelect.value = this.editProjectPreviousStage;
              if (this.editProjectPreviousStage !== 'Award' && editAwardBtn) editAwardBtn.style.display = 'none';
            }
          );
        } else {
          this.editProjectPreviousStage = newStage;
          if (editAwardBtn) editAwardBtn.style.display = 'none';
        }
      });
    }

    if (editAwardBtn) {
      editAwardBtn.addEventListener('click', () => {
        this.showAwardDetailsModal(document.getElementById('edit-project-id').value, this.currentEditProjectAwardData, (data) => {
          this.currentEditProjectAwardData = data;
        });
      });
    }

    // Form Submissions
    const addProjectForm = document.getElementById('add-project-form');
    if (addProjectForm) {
      addProjectForm.addEventListener('submit', (e) => this.handleProjectSubmit(e));
    }

    const addMemberForm = document.getElementById('add-member-form');
    if (addMemberForm) {
      addMemberForm.addEventListener('submit', (e) => this.handleMemberSubmit(e));
    }

    const addHolidayForm = document.getElementById('add-holiday-form');
    if (addHolidayForm) {
      addHolidayForm.addEventListener('submit', (e) => this.handleHolidaySubmit(e));
    }

    // Search and filter pipeline
    const searchInput = document.getElementById('pipeline-search');
    const filterRegion = document.getElementById('pipeline-filter-region');
    const filterInvestor = document.getElementById('pipeline-filter-investor');
    const filterBusiness = document.getElementById('pipeline-filter-business');
    const sortSelect = document.getElementById('pipeline-sort');
    
    [searchInput, filterRegion, filterInvestor, filterBusiness, sortSelect].forEach(el => {
      if (el) {
        el.addEventListener('input', () => this.renderPipelineTable());
        el.addEventListener('change', () => this.renderPipelineTable());
      }
    });

    // Search and filter awarded pipeline
    const searchInputAwarded = document.getElementById('awarded-pipeline-search');
    const filterRegionAwarded = document.getElementById('awarded-pipeline-filter-region');
    const filterInvestorAwarded = document.getElementById('awarded-pipeline-filter-investor');
    const filterBusinessAwarded = document.getElementById('awarded-pipeline-filter-business');
    const sortSelectAwarded = document.getElementById('awarded-pipeline-sort');
    
    [searchInputAwarded, filterRegionAwarded, filterInvestorAwarded, filterBusinessAwarded, sortSelectAwarded].forEach(el => {
      if (el) {
        el.addEventListener('input', () => this.renderAwardedPipelineTable());
        el.addEventListener('change', () => this.renderAwardedPipelineTable());
      }
    });

    // Backup import / export bindings
    const exportBtn = document.getElementById('backup-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = window.db.exportData();
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'project_dashboard_backup_' + new Date().toISOString().split('T')[0] + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      });
    }

    const importFile = document.getElementById('backup-import-file');
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          const success = window.db.importData(event.target.result);
          if (success) {
            alert('Database imported successfully!');
            window.location.reload();
          } else {
            alert('Failed to import database. Please verify the JSON file.');
          }
        };
        if (e.target.files[0]) {
          fileReader.readAsText(e.target.files[0]);
        }
      });
    }

    // Google Sheets Database Connection settings
    const saveGasUrlBtn = document.getElementById('save-gas-url-btn');
    const gasApiUrlInput = document.getElementById('gas-api-url');
    const gasStatusDiv = document.getElementById('gas-connection-status');

    if (saveGasUrlBtn && gasApiUrlInput && gasStatusDiv) {
      saveGasUrlBtn.addEventListener('click', () => {
        const url = gasApiUrlInput.value.trim();
        gasStatusDiv.style.display = 'block';
        gasStatusDiv.className = 'mt-3 fs-7 text-warning';
        gasStatusDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Testing connection to Google Sheets...';

        if (!url) {
          // Empty means disconnect and run in LocalStorage mode
          window.db.setGasUrl('');
          gasStatusDiv.className = 'mt-3 fs-7 text-success';
          gasStatusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>Database connection removed. Running in Local Storage mode.';
          // Reload view from local cache
          window.db.init();
          this.updateViews();
          return;
        }

        // Test the connection by calling action=get
        const testUrl = url.indexOf('?') !== -1 ? `${url}&action=get` : `${url}?action=get`;
        fetch(testUrl)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return res.json();
          })
          .then(serverDb => {
            if (serverDb && serverDb.projects) {
              // Successfully connected!
              window.db.setGasUrl(url);
              gasStatusDiv.className = 'mt-3 fs-7 text-success';
              gasStatusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>Connected successfully! Synced database with Google Sheets.';
              // Sync DB and reload views
              window.db.data = serverDb;
              window.db.patchAndMigrate();
              localStorage.setItem('PROJECT_DASHBOARD_DB_V3', JSON.stringify(serverDb));
              this.updateViews();
            } else {
              throw new Error('Response is not a valid database object');
            }
          })
          .catch(err => {
            console.error('Connection test failed:', err);
            gasStatusDiv.className = 'mt-3 fs-7 text-danger';
            gasStatusDiv.innerHTML = `<i class="fas fa-times-circle me-2"></i>Connection failed. Please check the Web App URL and ensure it is deployed with access for "Anyone". Error: ${err.message}`;
          });
      });
    }

    // Map Search Listeners
    const portSearchInput = document.getElementById('portfolio-map-search');
    const portSearchBtn = document.getElementById('portfolio-map-search-btn');
    if (portSearchInput && portSearchBtn) {
      portSearchBtn.addEventListener('click', () => this.searchMap('portfolio'));
      portSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.searchMap('portfolio');
        }
      });
    }

    const overSearchInput = document.getElementById('overview-map-search');
    const overSearchBtn = document.getElementById('overview-map-search-btn');
    if (overSearchInput && overSearchBtn) {
      overSearchBtn.addEventListener('click', () => this.searchMap('overview'));
      overSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.searchMap('overview');
        }
      });
    }

    // Initial renders
    this.updateViews();
  }

  // Set theme and update maps styling
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('THEME', theme);
    
    const style = theme === 'dark' ? this.darkMapStyle : this.lightMapStyle;
    if (this.portfolioMap) this.portfolioMap.setOptions({ styles: style });
    if (this.overviewMap) this.overviewMap.setOptions({ styles: style });

    // Also update pin icons to stand out
    this.updateMapMarkers();
  }

  // Switch SPA pages
  switchPage(pageId) {
    this.activePage = pageId;

    document.querySelectorAll('.menu-item-link, .bottom-nav-link').forEach(link => {
      if (link.getAttribute('data-page') === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.spa-page').forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Populate auto-generated Project Code when opening Add project page
    if (pageId === 'all-task') {
      const codeInput = document.getElementById('project-code');
      if (codeInput) {
        codeInput.value = window.db.generateNextProjectCode();
        codeInput.setAttribute('readonly', 'true');
      }
      
      // Reset temporary award details for new project
      this.currentAddProjectAwardData = {
        constructionDate: '',
        codDate: '',
        prTest: '',
        pv: '',
        inverter: '',
        awardNote: ''
      };
      this.addProjectPreviousStage = 'Underdevelop';
      const addAwardBtn = document.getElementById('add-award-details-btn');
      if (addAwardBtn) addAwardBtn.style.display = 'none';
      
      // Reset custom systems in the add container
      const addContainer = document.getElementById('add-project-systems-container');
      if (addContainer) {
        addContainer.querySelectorAll('.custom-system-item').forEach(item => item.remove());
      }
      
      // Render default deliverables checklist
      const defaultDels = [
        { name: 'Survey Reports', hours: 4, checked: false },
        { name: 'PV Layout', hours: 4, checked: false },
        { name: 'Single Line Diagram', hours: 4, checked: false },
        { name: 'PVSyst Simulation', hours: 4, checked: false },
        { name: 'Bill of Quantities (BOQ)', hours: 4, checked: false },
        { name: 'Load Profile Analysis', hours: 4, checked: false }
      ];
      this.renderDeliverables('add-project-deliverables-list', defaultDels);
      
      // Clear files attributes
      const fileInput = document.getElementById('project-image-file');
      if (fileInput) {
        fileInput.value = '';
        fileInput.removeAttribute('data-base64');
      }
    }

    // Refresh rendering and resize maps when page is shown
    if (pageId === 'portfolio') {
      this.renderPortfolioCharts();
      if (this.portfolioMap) {
        google.maps.event.trigger(this.portfolioMap, 'resize');
        this.portfolioMap.setCenter(this.thailandCenter);
      }
    } else if (pageId === 'overview') {
      this.renderOverviewCharts();
      if (this.overviewMap) {
        google.maps.event.trigger(this.overviewMap, 'resize');
        this.overviewMap.setCenter(this.thailandCenter);
      }
    } else if (pageId === 'pipeline') {
      this.renderPipelineTable();
    } else if (pageId === 'awarded-pipeline') {
      this.renderAwardedPipelineTable();
    } else if (pageId === 'kanban') {
      window.kanban.render();
    } else if (pageId === 'member-task') {
      this.renderMemberTasksTable();
    } else if (pageId === 'manhours') {
      window.manhours.render();
    } else if (pageId === 'calendar') {
      window.calendar.render();
    } else if (pageId === 'settings') {
      this.renderSettingsMembers();
      this.renderSettingsHolidays();
      this.populateMemberDropdowns();
      this.renderSettingsGasUrl();
    }
  }

  // Refresh all views
  updateViews() {
    this.populateMemberDropdowns();
    this.renderPortfolioCharts();
    this.renderOverviewCharts();
    this.renderPipelineTable();
    this.renderAwardedPipelineTable();
    this.renderMemberTasksTable();
    
    if (this.activePage === 'kanban') window.kanban.render();
    if (this.activePage === 'calendar') window.calendar.render();
    if (this.activePage === 'manhours') window.manhours.render();
    
    this.renderSettingsMembers();
    this.renderSettingsHolidays();
    this.renderSettingsGasUrl();
    this.updateMapMarkers();
  }

  initMaps() {
    const currentTheme = localStorage.getItem('THEME') || 'light';
    const mapStyle = currentTheme === 'dark' ? this.darkMapStyle : this.lightMapStyle;

    const mapOptions = {
      center: this.thailandCenter,
      zoom: 6,
      styles: mapStyle,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
      }
    };

    const portMapEl = document.getElementById('portfolio-map');
    if (portMapEl) {
      this.portfolioMap = new google.maps.Map(portMapEl, mapOptions);
      this.portfolioMap.addListener('click', () => {
        if (this.sharedInfoWindow) {
          this.sharedInfoWindow.close();
        }
      });
    }

    const overMapEl = document.getElementById('overview-map');
    if (overMapEl) {
      this.overviewMap = new google.maps.Map(overMapEl, mapOptions);
      this.overviewMap.addListener('click', () => {
        if (this.sharedInfoWindow) {
          this.sharedInfoWindow.close();
        }
      });
    }

    this.updateMapMarkers();
  }

  // Render modern SVG pins on the map
  updateMapMarkers() {
    if (!this.portfolioMap || !this.overviewMap) return;

    this.portfolioMarkers.forEach(m => m.setMap(null));
    this.overviewMarkers.forEach(m => m.setMap(null));
    this.portfolioMarkers = [];
    this.overviewMarkers = [];

    const projects = [...window.db.getProjects(), ...window.db.getAwardedProjects()];
    const members = window.db.getMembers();
    const currentTheme = localStorage.getItem('THEME') || 'light';

    projects.forEach(p => {
      if (p.lat === null || p.lng === null || isNaN(p.lat) || isNaN(p.lng)) {
        return; // Skip projects with no coordinates
      }
      const engineer = members.find(m => m.id === p.engineer);
      const engName = engineer ? engineer.name : 'Unassigned';

      let pinColor = '#025725';
      if (p.stage === 'Award') {
        pinColor = currentTheme === 'dark' ? '#2ecc71' : '#025725';
      } else {
        pinColor = currentTheme === 'dark' ? '#f59e0b' : '#d35400';
      }

      const markerIcon = this.getPinIconSvg(pinColor);

      // Capacity conversion and solar type identification
      let solarCapacityMW = 0;
      let activeSolarTypes = [];
      if (p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (sysName !== 'BESS' && cap > 0) {
            solarCapacityMW += parseFloat(cap);
            activeSolarTypes.push(sysName);
          }
        });
      }
      
      const solarTypesStr = activeSolarTypes.length > 0 ? activeSolarTypes.join(', ') : '-';
      
      let capacityStr = '';
      if (solarCapacityMW > 0) {
        capacityStr = `${(solarCapacityMW * 1000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 1})} kWp`;
        if (p.systems.BESS && p.systems.BESS > 0) {
          capacityStr += ` + BESS: ${p.systems.BESS.toFixed(1)} MW`;
        }
      } else if (p.systems.BESS && p.systems.BESS > 0) {
        capacityStr = `${p.systems.BESS.toFixed(1)} MW (BESS)`;
      } else {
        capacityStr = `${p.capacity.toFixed(2)} MW`;
      }

      const stageUpper = (p.stage || '').toUpperCase();
      const stageColorClass = p.stage === 'Award' ? 'text-success' : 'text-warning';
      const mapLink = p.googleMapsLink || ('https://www.google.com/maps?q=' + p.lat + ',' + p.lng);
      const weatherData = this.getMockWeather(p.region);
      
      let weatherHtml = `
        <div class="map-card-weather-title"><i class="fas fa-cloud-sun text-success me-1"></i>5-Day Weather Forecast</div>
        <div class="map-card-weather-grid">
      `;
      weatherData.forEach((wd, idx) => {
        if (idx === 0) {
          weatherHtml += `
            <div class="weather-day-box today">
              <div class="weather-today-left">
                <i class="fas ${wd.icon} fa-2x"></i>
              </div>
              <div class="weather-today-right">
                <div class="weather-day-name fw-bold" style="font-size: 10px;">${wd.dayName}</div>
                <div class="weather-today-temp">${wd.temp}</div>
                <div class="weather-day-wind" style="font-size: 8px;">${wd.desc} | ${wd.wind}</div>
              </div>
            </div>
          `;
        } else {
          weatherHtml += `
            <div class="weather-day-box">
              <div class="weather-day-name">${wd.dayName}</div>
              <i class="fas ${wd.icon} my-1"></i>
              <div class="fw-bold">${wd.temp}</div>
              <div class="weather-day-wind">${wd.wind}</div>
            </div>
          `;
        }
      });
      weatherHtml += `</div>`;

      // Award details for InfoWindow if stage is Award
      let awardDetailsHtml = '';
      if (p.stage === 'Award') {
        const installDateStr = this.formatDate(p.constructionDate);
        const codDateStr = this.formatDate(p.codDate);
        const pvStr = p.pv || '-';
        const inverterStr = p.inverter || '-';
        const prTestStr = p.prTest || '-';
        const awardNoteStr = p.awardNote || '-';

        awardDetailsHtml = `
          <div class="map-card-divider"></div>
          <div class="map-card-award-title"><i class="fas fa-trophy text-warning me-1"></i>Award Details</div>
          <div class="map-card-award-grid">
            <div class="award-detail-row">
              <div class="award-detail-label">Install:</div>
              <div class="award-detail-value">${installDateStr}</div>
            </div>
            <div class="award-detail-row">
              <div class="award-detail-label">COD:</div>
              <div class="award-detail-value">${codDateStr}</div>
            </div>
            <div class="award-detail-row">
              <div class="award-detail-label">PV:</div>
              <div class="award-detail-value">${pvStr}</div>
            </div>
            <div class="award-detail-row">
              <div class="award-detail-label">Inverter:</div>
              <div class="award-detail-value">${inverterStr}</div>
            </div>
            ${p.prTest ? `
            <div class="award-detail-row">
              <div class="award-detail-label">PR Test:</div>
              <div class="award-detail-value">${prTestStr}</div>
            </div>` : ''}
            ${p.awardNote ? `
            <div class="award-detail-row" style="grid-column: span 2;">
              <div class="award-detail-label">Note:</div>
              <div class="award-detail-value" style="word-break: normal; white-space: normal;">${awardNoteStr}</div>
            </div>` : ''}
          </div>
        `;
      }

      const fallbackImg = 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60';
      const infoHtml = `
        <div class="map-card-container">
          <div class="map-card-header">
            <h6 class="map-card-title">${p.code}: ${p.name}</h6>
            <a href="${mapLink}" target="_blank" class="map-card-btn">
              <i class="fas fa-map-marker-alt"></i> MAPS
            </a>
          </div>
          <div class="map-card-divider"></div>
          <div class="map-card-body">
            <div class="map-card-img-box">
              <img src="${p.image || fallbackImg}" class="map-card-img" alt="Plant Image" />
              <div class="map-card-caption">Plant overview:</div>
            </div>
            <div class="map-card-details">
              <div class="map-card-row">
                <div class="map-card-label">Client:</div>
                <div class="map-card-value">${p.client || '-'}</div>
              </div>
              <div class="map-card-row">
                <div class="map-card-label">Capacity:</div>
                <div class="map-card-value">${capacityStr}</div>
              </div>
              <div class="map-card-row">
                <div class="map-card-label">Solar Type:</div>
                <div class="map-card-value">${solarTypesStr}</div>
              </div>
              <div class="map-card-row">
                <div class="map-card-label">Business Type:</div>
                <div class="map-card-value">${p.businessType || '-'}</div>
              </div>
              <div class="map-card-row">
                <div class="map-card-label">Stage:</div>
                <div class="map-card-value fw-bold ${stageColorClass}">${stageUpper}</div>
              </div>
              <div class="map-card-row">
                <div class="map-card-label">BD Engineer:</div>
                <div class="map-card-value">${engName}</div>
              </div>
            </div>
          </div>
          <div class="map-card-divider"></div>
          ${weatherHtml}
          ${awardDetailsHtml}
        </div>
      `;

      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        icon: markerIcon,
        title: p.name
      });

      // Show on mouseover (hover)
      marker.addListener('mouseover', () => {
        if (!this.sharedInfoWindow) {
          this.sharedInfoWindow = new google.maps.InfoWindow();
        }
        this.sharedInfoWindow.setContent(infoHtml);
        this.sharedInfoWindow.open(p.stage === 'Award' ? this.portfolioMap : this.overviewMap, marker);
      });

      if (p.stage === 'Award') {
        marker.setMap(this.portfolioMap);
        this.portfolioMarkers.push(marker);
      } else if (p.stage === 'Underdevelop') {
        marker.setMap(this.overviewMap);
        this.overviewMarkers.push(marker);
      }
    });
  }

  // Render charts for Portfolio
  renderPortfolioCharts() {
    const projects = window.db.getAwardedProjects();
    
    // 1. Calculate Solar Systems Capacity (Excluding BESS)
    const solarTypes = ['Rooftop', 'Farm', 'Floating', 'Carpark'];
    const solarSystemData = {
      'Rooftop': 0,
      'Farm': 0,
      'Floating': 0,
      'Carpark': 0
    };
    
    let totalSolarCapacity = 0;
    
    projects.forEach(p => {
      if (p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (solarTypes.includes(sysName) && cap > 0) {
            solarSystemData[sysName] += parseFloat(cap);
            totalSolarCapacity += parseFloat(cap);
          }
        });
      }
    });

    // Populate bottom side details in 2x2 grid with solar icons
    const detailsEl = document.getElementById('portfolio-system-details');
    if (detailsEl) {
      const systemColors = {
        'Rooftop': '#025725',
        'Farm': '#10b981',
        'Floating': '#0284c7',
        'Carpark': '#f59e0b'
      };
      
      const systemIcons = {
        'Rooftop': 'fas fa-house-chimney',
        'Farm': 'fas fa-mountain-sun',
        'Floating': 'fas fa-water',
        'Carpark': 'fas fa-square-parking'
      };
      
      let detailsHtml = '<div class="row g-3">';
      solarTypes.forEach(type => {
        const cap = solarSystemData[type];
        const pct = totalSolarCapacity > 0 ? ((cap / totalSolarCapacity) * 100).toFixed(1) : '0.0';
        const typeProjects = projects.filter(p => p.systems && p.systems[type] > 0);
        const typeCount = typeProjects.length;
        
        detailsHtml += `
          <div class="col-6">
            <div class="p-3 rounded border d-flex align-items-center gap-3 stats-item-box" style="background: rgba(2, 87, 37, 0.015); border-color: var(--card-border) !important; min-height: 85px;">
              <div class="d-flex align-items-center justify-content-center rounded-circle" style="width: 44px; height: 44px; background: ${systemColors[type]}15; color: ${systemColors[type]}; flex-shrink: 0;">
                <i class="${systemIcons[type]}" style="font-size: 18px;"></i>
              </div>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="text-muted fw-semibold text-truncate mb-1" style="font-size: 12px; line-height: 1.2;">${type}</div>
                <div class="fw-bold text-success text-truncate" style="font-size: 14px; line-height: 1.2;">
                  ${cap.toFixed(2)} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">MWp</span>
                  <span class="text-dark-subtle fw-normal" style="font-size: 11px; font-weight: 500;">(${pct}%)</span>
                </div>
                <div class="text-muted text-truncate" style="font-size: 11px; margin-top: 2px;">
                  ${typeCount} ${typeCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      detailsHtml += '</div>';
      detailsEl.innerHTML = detailsHtml;
    }

    // Draw Doughnut Chart (Only Solar Systems, Excluding BESS)
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];
    
    const systemColors = {
      'Rooftop': '#013a17',
      'Farm': '#16a34a',
      'Floating': '#0284c7',
      'Carpark': '#84cc16'
    };

    solarTypes.forEach(type => {
      if (solarSystemData[type] > 0) {
        chartLabels.push(type);
        chartData.push(solarSystemData[type]);
        chartColors.push(systemColors[type]);
      }
    });

    this.drawSolarDoughnutChart('portfolio-system-chart', chartLabels, chartData, chartColors, this.portfolioCharts, projects.length);

    // 2. Render Region Table
    this.renderRegionTable('portfolio-region-table-body', projects);
  }

  // Render charts for Project Overview
  renderOverviewCharts() {
    const projects = window.db.getProjects().filter(p => p.stage === 'Underdevelop');
    
    // 1. Calculate Solar Systems Capacity (Excluding BESS)
    const solarTypes = ['Rooftop', 'Farm', 'Floating', 'Carpark'];
    const solarSystemData = {
      'Rooftop': 0,
      'Farm': 0,
      'Floating': 0,
      'Carpark': 0
    };
    
    let totalSolarCapacity = 0;
    
    projects.forEach(p => {
      if (p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (solarTypes.includes(sysName) && cap > 0) {
            solarSystemData[sysName] += parseFloat(cap);
            totalSolarCapacity += parseFloat(cap);
          }
        });
      }
    });

    // Populate bottom side details in 2x2 grid with solar icons
    const detailsEl = document.getElementById('overview-system-details');
    if (detailsEl) {
      const systemColors = {
        'Rooftop': '#025725',
        'Farm': '#10b981',
        'Floating': '#0284c7',
        'Carpark': '#f59e0b'
      };
      
      const systemIcons = {
        'Rooftop': 'fas fa-house-chimney',
        'Farm': 'fas fa-mountain-sun',
        'Floating': 'fas fa-water',
        'Carpark': 'fas fa-square-parking'
      };
      
      let detailsHtml = '<div class="row g-3">';
      solarTypes.forEach(type => {
        const cap = solarSystemData[type];
        const pct = totalSolarCapacity > 0 ? ((cap / totalSolarCapacity) * 100).toFixed(1) : '0.0';
        const typeProjects = projects.filter(p => p.systems && p.systems[type] > 0);
        const typeCount = typeProjects.length;
        
        detailsHtml += `
          <div class="col-6">
            <div class="p-3 rounded border d-flex align-items-center gap-3 stats-item-box" style="background: rgba(2, 87, 37, 0.015); border-color: var(--card-border) !important; min-height: 85px;">
              <div class="d-flex align-items-center justify-content-center rounded-circle" style="width: 44px; height: 44px; background: ${systemColors[type]}15; color: ${systemColors[type]}; flex-shrink: 0;">
                <i class="${systemIcons[type]}" style="font-size: 18px;"></i>
              </div>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="text-muted fw-semibold text-truncate mb-1" style="font-size: 12px; line-height: 1.2;">${type}</div>
                <div class="fw-bold text-success text-truncate" style="font-size: 14px; line-height: 1.2;">
                  ${cap.toFixed(2)} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">MWp</span>
                  <span class="text-dark-subtle fw-normal" style="font-size: 11px; font-weight: 500;">(${pct}%)</span>
                </div>
                <div class="text-muted text-truncate" style="font-size: 11px; margin-top: 2px;">
                  ${typeCount} ${typeCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      detailsHtml += '</div>';
      detailsEl.innerHTML = detailsHtml;
    }

    // Draw Doughnut Chart
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];
    
    const systemColors = {
      'Rooftop': '#025725',
      'Farm': '#10b981',
      'Floating': '#0284c7',
      'Carpark': '#f59e0b'
    };

    solarTypes.forEach(type => {
      if (solarSystemData[type] > 0) {
        chartLabels.push(type);
        chartData.push(solarSystemData[type]);
        chartColors.push(systemColors[type]);
      }
    });

    this.drawSolarDoughnutChart('overview-system-chart', chartLabels, chartData, chartColors, this.overviewCharts, projects.length);

    // 2. Render Region Table
    this.renderRegionTable('overview-region-table-body', projects);
  }

  drawSolarDoughnutChart(canvasId, labels, data, colors, chartRef, projectsCount) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (chartRef['system']) {
      chartRef['system'].destroy();
    }

    const totalVal = data.reduce((a, b) => a + b, 0);

    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No Solar Data'],
        datasets: [{
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.length > 0 ? colors : ['#7f8c8d'],
          borderColor: 'transparent',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw;
                return ` ${context.label}: ${parseFloat(val).toFixed(2)} MWp`;
              }
            }
          }
        },
        cutout: '55%' // Increased thickness (reduced cutout from 72% to 55%)
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          const width = chart.width,
                height = chart.height,
                ctx = chart.ctx;
          ctx.restore();
          
          let innerRadius = 80;
          try {
            const meta = chart.getDatasetMeta(0);
            if (meta && meta.controller && typeof meta.controller.innerRadius === 'number') {
              innerRadius = meta.controller.innerRadius;
            } else if (meta && meta.data && meta.data[0] && typeof meta.data[0].innerRadius === 'number') {
              innerRadius = meta.data[0].innerRadius;
            }
          } catch (e) {
            innerRadius = 80;
          }
          if (isNaN(innerRadius) || innerRadius <= 0) {
            innerRadius = 80;
          }
          
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          ctx.textBaseline = "middle";
          
          // Draw "xx.xx MWp" on top (Adjusted to exactly 18px at innerRadius=83)
          const valueText = `${totalVal.toFixed(2)} MWp`;
          const valFontSize = Math.round(innerRadius * 0.22); // 18px at innerRadius=83
          ctx.font = `bold ${valFontSize}px Outfit, sans-serif`;
          ctx.fillStyle = isDark ? "#e2ece6" : "#0d1a12";
          const valueX = Math.round((width - ctx.measureText(valueText).width) / 2);
          const valueY = height / 2 - 14;
          ctx.fillText(valueText, valueX, valueY);

          // Draw "TOTAL" below the value (Adjusted to exactly 12px at innerRadius=83)
          const labelText = "TOTAL";
          const labelFontSize = Math.round(innerRadius * 0.14); // 12px at innerRadius=83
          ctx.font = `bold ${labelFontSize}px Inter, sans-serif`;
          ctx.fillStyle = isDark ? "#8ca395" : "#536b5c";
          const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
          const labelY = height / 2 + 6;
          ctx.fillText(labelText, labelX, labelY);

          // Draw "X Projects" below TOTAL (Adjusted to exactly 11px at innerRadius=83)
          const projCountText = `${projectsCount || 0} ${projectsCount === 1 ? 'Project' : 'Projects'}`;
          const projFontSize = Math.round(innerRadius * 0.13); // 11px at innerRadius=83
          ctx.font = `bold ${projFontSize}px Inter, sans-serif`;
          ctx.fillStyle = isDark ? "#8ca395" : "#536b5c";
          const projX = Math.round((width - ctx.measureText(projCountText).width) / 2);
          const projY = height / 2 + 22;
          ctx.fillText(projCountText, projX, projY);
          
          ctx.save();
        }
      }]
    };

    chartRef['system'] = new Chart(canvas, chartConfig);
  }

  renderRegionTable(tbodyId, projects) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const solarTypes = ['Rooftop', 'Farm', 'Floating', 'Carpark'];
    const regions = ['Central', 'North', 'South', 'Northeast', 'East', 'West'];
    
    // Create data matrix
    const matrix = {};
    solarTypes.forEach(type => {
      matrix[type] = {};
      regions.forEach(reg => {
        matrix[type][reg] = 0;
      });
    });

    // Populate data matrix
    projects.forEach(p => {
      const reg = p.region;
      if (regions.includes(reg) && p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (solarTypes.includes(sysName) && cap > 0) {
            matrix[sysName][reg] += parseFloat(cap);
          }
        });
      }
    });

    // Render rows without Total column
    let html = '';
    
    // Store column totals
    const colTotals = {};
    regions.forEach(reg => { colTotals[reg] = 0; });

    solarTypes.forEach(type => {
      html += `<tr><td class="fw-semibold text-start ps-2">${type}</td>`;
      regions.forEach(reg => {
        const val = matrix[type][reg];
        colTotals[reg] += val;
        html += `<td>${val > 0 ? val.toFixed(2) : '-'}</td>`;
      });
      html += `</tr>`;
    });

    // Total row
    html += `<tr class="total-row"><td>Total</td>`;
    regions.forEach(reg => {
      const val = colTotals[reg];
      html += `<td>${val > 0 ? val.toFixed(2) : '-'}</td>`;
    });
    html += `</tr>`;

    tbody.innerHTML = html;
  }

  // Render Pipeline Table
  renderPipelineTable() {
    const tbody = document.getElementById('pipeline-table-body');
    if (!tbody) return;

    const searchStr = (document.getElementById('pipeline-search').value || '').toLowerCase();
    const region = document.getElementById('pipeline-filter-region').value;
    const investor = document.getElementById('pipeline-filter-investor').value;
    const business = document.getElementById('pipeline-filter-business').value;
    const sortVal = document.getElementById('pipeline-sort') ? document.getElementById('pipeline-sort').value : 'nearest';

    let projects = window.db.getProjects();
    const members = window.db.getMembers();

    // Filters
    if (searchStr) {
      projects = projects.filter(p => 
        p.code.toLowerCase().includes(searchStr) || 
        p.name.toLowerCase().includes(searchStr) || 
        p.client.toLowerCase().includes(searchStr)
      );
    }
    if (region) projects = projects.filter(p => p.region === region);
    if (investor) projects = projects.filter(p => p.investor === investor);
    if (business) projects = projects.filter(p => p.businessType === business);

    // Sorting
    if (sortVal === 'nearest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const bd = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return ad - bd;
      });
    } else if (sortVal === 'latest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(0);
        const bd = b.deadline ? new Date(b.deadline) : new Date(0);
        return bd - ad;
      });
    } else if (sortVal === 'code') {
      projects.sort((a, b) => a.code.localeCompare(b.code));
    }

    // Render Summary Cards Row
    let countTotal = projects.length;
    let countRooftop = 0, sumRooftop = 0;
    let countFarm = 0, sumFarm = 0;
    let countFloat = 0, sumFloat = 0;
    let countCarpark = 0, sumCarpark = 0;
    let countBESS = 0, sumBESS = 0;

    projects.forEach(p => {
      if (p.systems) {
        if (p.systems.Rooftop > 0) {
          sumRooftop += parseFloat(p.systems.Rooftop) * 1000;
          countRooftop++;
        }
        if (p.systems.Farm > 0) {
          sumFarm += parseFloat(p.systems.Farm) * 1000;
          countFarm++;
        }
        if (p.systems.Floating > 0) {
          sumFloat += parseFloat(p.systems.Floating) * 1000;
          countFloat++;
        }
        if (p.systems.Carpark > 0) {
          sumCarpark += parseFloat(p.systems.Carpark) * 1000;
          countCarpark++;
        }
        if (p.systems.BESS > 0) {
          sumBESS += parseFloat(p.systems.BESS) * 1000;
          countBESS++;
        }
      }
    });

    const summaryContainer = document.getElementById('pipeline-summary-cards');
    if (summaryContainer) {
      const sumTotal = sumRooftop + sumFarm + sumFloat + sumCarpark + sumBESS;
      summaryContainer.innerHTML = `
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-total">
            <div class="pipeline-card-title"><i class="fas fa-list-check"></i> Total Projects</div>
            <div class="pipeline-card-value">${sumTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp/kWh</div>
            <div class="pipeline-card-subtext">Total: ${countTotal} ${countTotal === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-rooftop">
            <div class="pipeline-card-title"><i class="fas fa-house-chimney"></i> Solar Rooftop</div>
            <div class="pipeline-card-value">${sumRooftop.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countRooftop} ${countRooftop === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-farm">
            <div class="pipeline-card-title"><i class="fas fa-mountain-sun"></i> Solar Farm</div>
            <div class="pipeline-card-value">${sumFarm.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countFarm} ${countFarm === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-float">
            <div class="pipeline-card-title"><i class="fas fa-water"></i> Solar Float</div>
            <div class="pipeline-card-value">${sumFloat.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countFloat} ${countFloat === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-carpark">
            <div class="pipeline-card-title"><i class="fas fa-square-parking"></i> Solar Carpark</div>
            <div class="pipeline-card-value">${sumCarpark.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countCarpark} ${countCarpark === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-bess">
            <div class="pipeline-card-title"><i class="fas fa-battery-three-quarters"></i> BESS</div>
            <div class="pipeline-card-value">${sumBESS.toLocaleString(undefined, {maximumFractionDigits: 0})} kWh</div>
            <div class="pipeline-card-subtext">Total: ${countBESS} ${countBESS === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
      `;
    }

    tbody.innerHTML = '';

    if (projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="13" class="text-center py-4 text-muted">No projects found matching the filter options.</td></tr>`;
      return;
    }

    projects.forEach(p => {
      const eng = members.find(m => m.id === p.engineer);
      const engName = eng ? eng.name : 'Unassigned';

      const row = document.createElement('tr');
      
      let statusBadge = '<span class="badge bg-secondary">Standby</span>';
      if (p.status === 'In Progress') statusBadge = '<span class="badge bg-warning text-dark">In Progress</span>';
      else if (p.status === 'Complete') statusBadge = '<span class="badge bg-success" style="background-color: var(--primary-color) !important;">Complete</span>';
      else if (p.status === 'Cancel') statusBadge = '<span class="badge bg-danger">Cancel</span>';

      let stageBadge = '<span class="badge bg-secondary">Hold</span>';
      if (p.stage === 'Underdevelop') stageBadge = '<span class="badge bg-info text-dark">Underdevelop</span>';
      else if (p.stage === 'Award') stageBadge = '<span class="badge bg-success" style="background-color: var(--primary-color) !important;">Award</span>';
      else if (p.stage === 'Cancle') stageBadge = '<span class="badge bg-danger">Cancle</span>';

      let systemsHtml = '';
      if (p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (cap > 0) {
            let sysBadgeClass = 'bg-success';
            if (sysName === 'Farm') sysBadgeClass = 'bg-warning text-dark';
            else if (sysName === 'Floating') sysBadgeClass = 'bg-info text-dark';
            else if (sysName === 'Carpark') sysBadgeClass = 'bg-secondary';
            else if (sysName === 'BESS') sysBadgeClass = 'bg-danger';

            const unit = sysName === 'BESS' ? 'kWh' : 'kWp';
            systemsHtml += `<span class="badge ${sysBadgeClass} me-1 mb-1">${sysName} (${(parseFloat(cap) * 1000).toFixed(0)} ${unit})</span>`;
          }
        });
      }
      if (!systemsHtml) systemsHtml = '<span class="text-muted">-</span>';

      const capInkWp = p.capacity * 1000;
      const capacityText = `${capInkWp.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp`;
      const mapsUrl = (p.lat !== null && p.lng !== null && !isNaN(p.lat) && !isNaN(p.lng)) ? 'https://www.google.com/maps?q=' + p.lat + ',' + p.lng : '';

      row.innerHTML = `
        <td class="fw-bold">${p.code}</td>
        <td>
          <a href="#" class="text-success fw-bold text-decoration-none" onclick="event.preventDefault(); window.app.openEditProjectModal('${p.id}')">
            ${p.name}
          </a>
        </td>
        <td>${p.region}</td>
        <td>${engName}</td>
        <td class="fw-bold text-primary">${p.investor}</td>
        <td>${p.businessType}</td>
        <td>${p.client}</td>
        <td><div class="d-flex flex-wrap">${systemsHtml}</div></td>
        <td class="text-end fw-bold">${capacityText}</td>
        <td>
          ${mapsUrl ? `
            <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-outline-success py-0" style="font-size: 11px;">
              <i class="fas fa-map-marker-alt"></i> ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}
            </a>
          ` : `
            <span class="text-muted" style="font-size: 11px;">
              <i class="fas fa-location-slash me-1"></i>No Coordinates
            </span>
          `}
        </td>
        <td class="text-center">${this.formatDate(p.deadline)}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">${stageBadge}</td>
      `;

      tbody.appendChild(row);
    });
  }

  // Render Awarded Pipeline Table
  renderAwardedPipelineTable() {
    const tbody = document.getElementById('awarded-pipeline-table-body');
    if (!tbody) return;

    const searchStr = (document.getElementById('awarded-pipeline-search').value || '').toLowerCase();
    const region = document.getElementById('awarded-pipeline-filter-region').value;
    const investor = document.getElementById('awarded-pipeline-filter-investor').value;
    const business = document.getElementById('awarded-pipeline-filter-business').value;
    const sortVal = document.getElementById('awarded-pipeline-sort') ? document.getElementById('awarded-pipeline-sort').value : 'nearest';

    let projects = window.db.getAwardedProjects();
    const members = window.db.getMembers();

    // Filters
    if (searchStr) {
      projects = projects.filter(p => 
        p.code.toLowerCase().includes(searchStr) || 
        p.name.toLowerCase().includes(searchStr) || 
        p.client.toLowerCase().includes(searchStr)
      );
    }
    if (region) projects = projects.filter(p => p.region === region);
    if (investor) projects = projects.filter(p => p.investor === investor);
    if (business) projects = projects.filter(p => p.businessType === business);

    // Sorting
    if (sortVal === 'nearest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const bd = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return ad - bd;
      });
    } else if (sortVal === 'latest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(0);
        const bd = b.deadline ? new Date(b.deadline) : new Date(0);
        return bd - ad;
      });
    } else if (sortVal === 'code') {
      projects.sort((a, b) => a.code.localeCompare(b.code));
    }

    // Render Summary Cards Row
    let countTotal = projects.length;
    let countRooftop = 0, sumRooftop = 0;
    let countFarm = 0, sumFarm = 0;
    let countFloat = 0, sumFloat = 0;
    let countCarpark = 0, sumCarpark = 0;
    let countBESS = 0, sumBESS = 0;

    projects.forEach(p => {
      if (p.systems) {
        if (p.systems.Rooftop > 0) {
          sumRooftop += parseFloat(p.systems.Rooftop) * 1000;
          countRooftop++;
        }
        if (p.systems.Farm > 0) {
          sumFarm += parseFloat(p.systems.Farm) * 1000;
          countFarm++;
        }
        if (p.systems.Floating > 0) {
          sumFloat += parseFloat(p.systems.Floating) * 1000;
          countFloat++;
        }
        if (p.systems.Carpark > 0) {
          sumCarpark += parseFloat(p.systems.Carpark) * 1000;
          countCarpark++;
        }
        if (p.systems.BESS > 0) {
          sumBESS += parseFloat(p.systems.BESS) * 1000;
          countBESS++;
        }
      }
    });

    const summaryContainer = document.getElementById('awarded-pipeline-summary-cards');
    if (summaryContainer) {
      const sumTotal = sumRooftop + sumFarm + sumFloat + sumCarpark + sumBESS;
      summaryContainer.innerHTML = `
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-total">
            <div class="pipeline-card-title"><i class="fas fa-list-check"></i> Total Projects</div>
            <div class="pipeline-card-value">${sumTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp/kWh</div>
            <div class="pipeline-card-subtext">Total: ${countTotal} ${countTotal === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-rooftop">
            <div class="pipeline-card-title"><i class="fas fa-house-chimney"></i> Solar Rooftop</div>
            <div class="pipeline-card-value">${sumRooftop.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countRooftop} ${countRooftop === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-farm">
            <div class="pipeline-card-title"><i class="fas fa-mountain-sun"></i> Solar Farm</div>
            <div class="pipeline-card-value">${sumFarm.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countFarm} ${countFarm === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-float">
            <div class="pipeline-card-title"><i class="fas fa-water"></i> Solar Float</div>
            <div class="pipeline-card-value">${sumFloat.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countFloat} ${countFloat === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-carpark">
            <div class="pipeline-card-title"><i class="fas fa-square-parking"></i> Solar Carpark</div>
            <div class="pipeline-card-value">${sumCarpark.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp</div>
            <div class="pipeline-card-subtext">Total: ${countCarpark} ${countCarpark === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
        <div class="col-md-4 col-lg-2">
          <div class="pipeline-card pipeline-card-bess">
            <div class="pipeline-card-title"><i class="fas fa-battery-three-quarters"></i> BESS</div>
            <div class="pipeline-card-value">${sumBESS.toLocaleString(undefined, {maximumFractionDigits: 0})} kWh</div>
            <div class="pipeline-card-subtext">Total: ${countBESS} ${countBESS === 1 ? 'project' : 'projects'}</div>
          </div>
        </div>
      `;
    }

    tbody.innerHTML = '';

    if (projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="13" class="text-center py-4 text-muted">No projects found matching the filter options.</td></tr>`;
      return;
    }

    projects.forEach(p => {
      const eng = members.find(m => m.id === p.engineer);
      const engName = eng ? eng.name : 'Unassigned';

      const row = document.createElement('tr');
      
      let statusBadge = '<span class="badge bg-secondary">Standby</span>';
      if (p.status === 'In Progress') statusBadge = '<span class="badge bg-warning text-dark">In Progress</span>';
      else if (p.status === 'Complete') statusBadge = '<span class="badge bg-success" style="background-color: var(--primary-color) !important;">Complete</span>';
      else if (p.status === 'Cancel') statusBadge = '<span class="badge bg-danger">Cancel</span>';

      let stageBadge = '<span class="badge bg-secondary">Hold</span>';
      if (p.stage === 'Underdevelop') stageBadge = '<span class="badge bg-info text-dark">Underdevelop</span>';
      else if (p.stage === 'Award') stageBadge = '<span class="badge bg-success" style="background-color: var(--primary-color) !important;">Award</span>';
      else if (p.stage === 'Cancle') stageBadge = '<span class="badge bg-danger">Cancle</span>';

      let systemsHtml = '';
      if (p.systems) {
        Object.entries(p.systems).forEach(([sysName, cap]) => {
          if (cap > 0) {
            let sysBadgeClass = 'bg-success';
            if (sysName === 'Farm') sysBadgeClass = 'bg-warning text-dark';
            else if (sysName === 'Floating') sysBadgeClass = 'bg-info text-dark';
            else if (sysName === 'Carpark') sysBadgeClass = 'bg-secondary';
            else if (sysName === 'BESS') sysBadgeClass = 'bg-danger';

            const unit = sysName === 'BESS' ? 'kWh' : 'kWp';
            systemsHtml += `<span class="badge ${sysBadgeClass} me-1 mb-1">${sysName} (${(parseFloat(cap) * 1000).toFixed(0)} ${unit})</span>`;
          }
        });
      }
      if (!systemsHtml) systemsHtml = '<span class="text-muted">-</span>';

      const capInkWp = p.capacity * 1000;
      const capacityText = `${capInkWp.toLocaleString(undefined, {maximumFractionDigits: 0})} kWp`;
      const mapsUrl = (p.lat !== null && p.lng !== null && !isNaN(p.lat) && !isNaN(p.lng)) ? 'https://www.google.com/maps?q=' + p.lat + ',' + p.lng : '';

      row.innerHTML = `
        <td class="fw-bold">${p.code}</td>
        <td>
          <a href="#" class="text-success fw-bold text-decoration-none" onclick="event.preventDefault(); window.app.openEditProjectModal('${p.id}')">
            ${p.name}
          </a>
        </td>
        <td>${p.region}</td>
        <td>${engName}</td>
        <td class="fw-bold text-primary">${p.investor}</td>
        <td>${p.businessType}</td>
        <td>${p.client}</td>
        <td><div class="d-flex flex-wrap">${systemsHtml}</div></td>
        <td class="text-end fw-bold">${capacityText}</td>
        <td>
          ${mapsUrl ? `
            <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-outline-success py-0" style="font-size: 11px;">
              <i class="fas fa-map-marker-alt"></i> ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}
            </a>
          ` : `
            <span class="text-muted" style="font-size: 11px;">
              <i class="fas fa-location-slash me-1"></i>No Coordinates
            </span>
          `}
        </td>
        <td class="text-center">${this.formatDate(p.deadline)}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">${stageBadge}</td>
      `;

      tbody.appendChild(row);
    });
  }

  // Render Member Task Table
  renderMemberTasksTable() {
    const headerRow = document.getElementById('member-task-header-row');
    const bodyRow = document.getElementById('member-task-body-row');
    if (!headerRow || !bodyRow) return;

    const members = window.db.getMembers();
    const projects = [...window.db.getProjects(), ...window.db.getAwardedProjects()];

    headerRow.innerHTML = '';
    bodyRow.innerHTML = '';

    if (members.length === 0) {
      headerRow.innerHTML = `<th>No Members</th>`;
      bodyRow.innerHTML = `<td class="text-center py-4 text-muted">Please add members in settings first.</td>`;
      return;
    }

    members.forEach(member => {
      const th = document.createElement('th');
      th.innerHTML = `
        <div>${member.name}</div>
        <small class="text-white-50" style="font-size: 11px; font-weight: normal;">${member.role}</small>
      `;
      headerRow.appendChild(th);

      const td = document.createElement('td');
      td.className = 'member-task-cell';
      
      const memberProjects = projects.filter(p => p.engineer === member.id);
      
      if (memberProjects.length === 0) {
        td.innerHTML = `<div class="text-center text-muted py-3" style="font-size: 12px; font-style: italic;">No active projects</div>`;
      } else {
        memberProjects.forEach(p => {
          const chip = document.createElement('a');
          chip.href = '#';
          chip.className = 'member-project-chip';
          
          let stageBadge = `<span class="badge bg-secondary text-white float-end" style="font-size: 9px;">Hold</span>`;
          if (p.stage === 'Underdevelop') {
            stageBadge = `<span class="badge bg-warning text-dark float-end" style="font-size: 9px;">Dev</span>`;
          } else if (p.stage === 'Award') {
            stageBadge = `<span class="badge bg-success text-white float-end" style="font-size: 9px; background-color: var(--primary-color) !important;">Award</span>`;
          } else if (p.stage === 'Cancle') {
            stageBadge = `<span class="badge bg-danger text-white float-end" style="font-size: 9px;">Cancle</span>`;
          }

          chip.innerHTML = `
            ${stageBadge}
            <div class="fw-bold text-truncate" style="max-width: 140px;">${p.name}</div>
            <div class="mt-1 d-flex justify-content-between text-muted" style="font-size: 10px;">
              <span>${p.code}</span>
              <span><strong>${p.capacity.toFixed(1)} MW</strong></span>
            </div>
          `;

          chip.addEventListener('click', (e) => {
            e.preventDefault();
            this.openEditProjectModal(p.id);
          });

          td.appendChild(chip);
        });
      }

      bodyRow.appendChild(td);
    });
  }

  populateMemberDropdowns() {
    const dropdowns = [
      document.getElementById('project-engineer'),
      document.getElementById('edit-project-engineer')
    ];
    const members = window.db.getMembers();

    dropdowns.forEach(drop => {
      if (!drop) return;
      const firstOpt = drop.options[0] ? drop.options[0].outerHTML : '<option value="">-- Select BD Engineer --</option>';
      drop.innerHTML = firstOpt;
      
      members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = `${m.name} (${m.role})`;
        drop.appendChild(opt);
      });
    });
  }

  renderSettingsMembers() {
    const list = document.getElementById('settings-members-list');
    if (!list) return;

    const members = window.db.getMembers();
    list.innerHTML = '';

    if (members.length === 0) {
      list.innerHTML = `<li class="list-group-item text-center text-muted">No members registered in the system.</li>`;
      return;
    }

    members.forEach(m => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center py-2';
      li.innerHTML = `
        <div>
          <span class="fw-bold text-success">${m.name}</span>
          <span class="badge bg-light text-dark border ms-2">${m.role}</span>
        </div>
        <button class="btn btn-sm btn-outline-danger border-0" onclick="window.app.handleDeleteMember('${m.id}')" title="Delete Member">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      list.appendChild(li);
    });
  }

  renderSettingsHolidays() {
    const list = document.getElementById('settings-holidays-list');
    if (!list) return;

    const holidays = window.db.getHolidays();
    list.innerHTML = '';

    if (holidays.length === 0) {
      list.innerHTML = `<li class="list-group-item text-center text-muted">No company holidays set.</li>`;
      return;
    }

    holidays.forEach(h => {
      const [y, m, d] = h.date.split('-');
      const formattedDate = `${d}/${m}/${y}`;
      
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center py-2';
      li.innerHTML = `
        <div>
          <span class="badge bg-danger me-2">${formattedDate}</span>
          <span>${h.name}</span>
        </div>
        <button class="btn btn-sm btn-outline-danger border-0" onclick="window.app.handleDeleteHoliday('${h.id}')" title="Delete Holiday">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      list.appendChild(li);
    });
  }

  renderSettingsGasUrl() {
    const input = document.getElementById('gas-api-url');
    if (input) {
      input.value = window.db.getGasUrl();
    }
    const statusDiv = document.getElementById('gas-connection-status');
    if (statusDiv) {
      if (window.db.getGasUrl()) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'mt-3 fs-7 text-success';
        statusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>Google Sheets connection is active.';
      } else {
        statusDiv.style.display = 'none';
      }
    }
  }

  openEditProjectModal(id) {
    const proj = window.db.getProject(id);
    if (!proj) return;

    document.getElementById('edit-project-id').value = proj.id;
    document.getElementById('edit-project-code').value = proj.code;
    document.getElementById('edit-project-name').value = proj.name;
    document.getElementById('edit-project-region').value = proj.region;
    document.getElementById('edit-project-engineer').value = proj.engineer;
    document.getElementById('edit-project-business').value = proj.businessType;
    document.getElementById('edit-project-investor').value = proj.investor;
    document.getElementById('edit-project-client').value = proj.client;
    const coordsInput = document.getElementById('edit-project-coords');
    if (coordsInput) {
      if (proj.lat !== null && proj.lng !== null && !isNaN(proj.lat) && !isNaN(proj.lng)) {
        coordsInput.value = `${proj.lat.toFixed(6)}, ${proj.lng.toFixed(6)}`;
      } else {
        coordsInput.value = '';
      }
    }
    document.getElementById('edit-project-status').value = proj.status;
    document.getElementById('edit-project-stage').value = proj.stage;
    document.getElementById('edit-project-deadline').value = proj.deadline;
    document.getElementById('edit-project-maps-link').value = proj.googleMapsLink || '';
    document.getElementById('edit-project-notes').value = proj.notes || '';

    // Initialize temporary award data for Edit Project
    this.currentEditProjectAwardData = {
      constructionDate: proj.constructionDate || '',
      codDate: proj.codDate || '',
      prTest: proj.prTest || '',
      pv: proj.pv || '',
      inverter: proj.inverter || '',
      awardNote: proj.awardNote || ''
    };
    this.editProjectPreviousStage = proj.stage;
    
    // Toggle the Edit Award details button
    const editAwardBtn = document.getElementById('edit-award-details-btn');
    if (proj.stage === 'Award') {
      if (editAwardBtn) editAwardBtn.style.display = 'inline-block';
    } else {
      if (editAwardBtn) editAwardBtn.style.display = 'none';
    }

    // Reset standard checkboxes and input values
    ['Rooftop', 'Farm', 'Floating', 'Carpark', 'BESS'].forEach(sys => {
      const chk = document.getElementById(`edit-project-system-${sys}`);
      const capVal = document.getElementById(`edit-project-capacity-${sys}`);
      const wrapper = document.getElementById(`edit-project-capacity-${sys}-wrapper`);
      
      if (chk && capVal && wrapper) {
        chk.checked = false;
        capVal.value = '';
        wrapper.style.display = 'none';
      }
    });

    // Remove old custom system rows from container
    const editContainer = document.getElementById('edit-project-systems-container');
    if (editContainer) {
      editContainer.querySelectorAll('.custom-system-item').forEach(item => item.remove());
    }

    // Populate checkboxes and input capacities (both standard and custom)
    if (proj.systems) {
      const standardSystems = ['Rooftop', 'Farm', 'Floating', 'Carpark', 'BESS'];
      Object.entries(proj.systems).forEach(([sys, cap]) => {
        if (standardSystems.includes(sys)) {
          const chk = document.getElementById(`edit-project-system-${sys}`);
          const capVal = document.getElementById(`edit-project-capacity-${sys}`);
          const wrapper = document.getElementById(`edit-project-capacity-${sys}-wrapper`);
          
          if (chk && capVal && wrapper && cap > 0) {
            chk.checked = true;
            capVal.value = cap;
            wrapper.style.display = 'block';
          }
        } else if (cap > 0) {
          // Custom system!
          this.appendCustomSystemItem('edit-project-systems-container', sys, cap);
        }
      });
    }

    // Load deliverables
    this.renderDeliverables('edit-project-deliverables-list', proj.deliverables || []);

    // Load revisions
    this.currentEditProjectRevisions = proj.revisions ? [...proj.revisions] : [];
    this.renderRevisionsList('edit-project-revise-list', this.currentEditProjectRevisions);

    // Setup Add Revision listener
    const addRevBtn = document.getElementById('edit-project-add-revise-btn');
    if (addRevBtn) {
      addRevBtn.onclick = () => {
        const input = document.getElementById('edit-project-new-revise-details');
        const details = input ? input.value.trim() : '';
        if (!details) {
          alert('กรุณาระบุรายละเอียดที่ต้องการ Revise');
          return;
        }
        const nextRevNo = this.currentEditProjectRevisions.length + 1;
        this.currentEditProjectRevisions.push({
          revNo: nextRevNo,
          details: details,
          date: new Date().toISOString().split('T')[0]
        });
        if (input) input.value = '';
        this.renderRevisionsList('edit-project-revise-list', this.currentEditProjectRevisions);
      };
    }

    // Reset image fields
    const editFileInp = document.getElementById('edit-project-image-file');
    if (editFileInp) {
      editFileInp.value = '';
      editFileInp.removeAttribute('data-base64');
    }
    const editUrlInp = document.getElementById('edit-project-image-url');
    if (editUrlInp) {
      editUrlInp.value = proj.image && !proj.image.startsWith('data:image') ? proj.image : '';
    }

    const deleteBtn = document.getElementById('edit-project-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => this.handleDeleteProject(proj.id);
    }

    const editForm = document.getElementById('edit-project-form');
    editForm.onsubmit = (e) => {
      e.preventDefault();
      
      const systemsObj = this.readSystemsFromDom('edit-project-systems-container');

      const coordsVal = document.getElementById('edit-project-coords').value.trim();
      const mapsLink = document.getElementById('edit-project-maps-link').value.trim();
      const { lat, lng } = this.parseCoordinates(coordsVal, mapsLink);

      // Image resolution
      let imageVal = proj.image; // default to old image
      const fileInput = document.getElementById('edit-project-image-file');
      const fileBase64 = fileInput ? fileInput.getAttribute('data-base64') : null;
      const urlVal = document.getElementById('edit-project-image-url').value.trim();
      if (fileBase64) {
        imageVal = fileBase64;
      } else if (urlVal) {
        imageVal = urlVal;
      }

      // Deliverables and notes
      const deliverablesList = this.readDeliverablesFromDom('edit-project-deliverables-list');
      const notesVal = document.getElementById('edit-project-notes').value;
      const stageVal = document.getElementById('edit-project-stage').value;

      const updated = {
        name: document.getElementById('edit-project-name').value,
        region: document.getElementById('edit-project-region').value,
        engineer: document.getElementById('edit-project-engineer').value,
        businessType: document.getElementById('edit-project-business').value,
        investor: document.getElementById('edit-project-investor').value,
        client: document.getElementById('edit-project-client').value,
        systems: systemsObj,
        lat: lat,
        lng: lng,
        googleMapsLink: mapsLink,
        image: imageVal,
        deliverables: deliverablesList,
        revisions: this.currentEditProjectRevisions,
        notes: notesVal,
        status: document.getElementById('edit-project-status').value,
        stage: stageVal,
        deadline: document.getElementById('edit-project-deadline').value,
        // Include award details if stage is Award
        ...(stageVal === 'Award' ? this.currentEditProjectAwardData : {
          constructionDate: '',
          codDate: '',
          prTest: '',
          pv: '',
          inverter: '',
          awardNote: ''
        })
      };

      const success = window.db.updateProject(proj.id, updated);
      if (success) {
        const modalEl = document.getElementById('editProjectModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        this.updateViews();
      }
    };

    const myModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    myModal.show();
  }

  renderRevisionsList(containerId, revisions) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!revisions || revisions.length === 0) {
      container.innerHTML = '<div class="text-muted text-center py-2" style="font-size: 12px;">ไม่มีประวัติการ Revise</div>';
      return;
    }
    
    revisions.forEach(rev => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center py-2';
      item.style.fontSize = '12px';
      item.style.background = 'transparent';
      item.style.borderColor = 'var(--card-border)';
      item.style.color = 'var(--text-color)';
      item.innerHTML = `
        <div>
          <span class="badge bg-secondary me-2">Rev ${rev.revNo}</span>
          <span>${rev.details}</span>
          <span class="text-muted ms-2" style="font-size: 10px;">(${rev.date})</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger border-0 p-1" onclick="window.app.deleteRevision(${rev.revNo})" title="Delete Revision">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      container.appendChild(item);
    });
  }

  deleteRevision(revNo) {
    if (confirm('คุณต้องการลบรายการ Revise นี้ใช่หรือไม่?')) {
      this.currentEditProjectRevisions = this.currentEditProjectRevisions.filter(r => r.revNo !== revNo);
      // Re-index revision numbers
      this.currentEditProjectRevisions.forEach((r, idx) => {
        r.revNo = idx + 1;
      });
      this.renderRevisionsList('edit-project-revise-list', this.currentEditProjectRevisions);
    }
  }

  // Handle Project Add Submit
  handleProjectSubmit(e) {
    e.preventDefault();
    
    const code = document.getElementById('project-code').value;
    const name = document.getElementById('project-name').value;
    const region = document.getElementById('project-region').value;
    const engineer = document.getElementById('project-engineer').value;
    const businessType = document.getElementById('project-business').value;
    const investor = document.getElementById('project-investor').value;
    const client = document.getElementById('project-client').value;
    
    const coordsVal = document.getElementById('project-coords').value.trim();
    const mapsLink = document.getElementById('project-maps-link').value.trim();
    const { lat, lng } = this.parseCoordinates(coordsVal, mapsLink);
    
    const status = document.getElementById('project-status').value;
    const stage = document.getElementById('project-stage').value;
    const deadline = document.getElementById('project-deadline').value;

    const systemsObj = this.readSystemsFromDom('add-project-systems-container');
    
    let hasSystemSelected = Object.keys(systemsObj).length > 0;
    if (!hasSystemSelected) {
      alert('Please check at least one installation system type and set its capacity.');
      return;
    }

    // Image resolution
    let imageVal = '';
    const fileInput = document.getElementById('project-image-file');
    const fileBase64 = fileInput ? fileInput.getAttribute('data-base64') : null;
    const urlVal = document.getElementById('project-image-url').value.trim();
    if (fileBase64) {
      imageVal = fileBase64;
    } else if (urlVal) {
      imageVal = urlVal;
    } else {
      imageVal = 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60';
    }

    // Deliverables and notes
    const deliverablesList = this.readDeliverablesFromDom('add-project-deliverables-list');
    const notesVal = document.getElementById('project-notes').value;

    const awardDetails = stage === 'Award' ? this.currentAddProjectAwardData : {
      constructionDate: '',
      codDate: '',
      prTest: '',
      pv: '',
      inverter: '',
      awardNote: ''
    };

    const newProj = window.db.addProject({
      code, name, region, engineer, businessType, investor, client, 
      systems: systemsObj, lat, lng, googleMapsLink: mapsLink, 
      image: imageVal, deliverables: deliverablesList, notes: notesVal,
      status, stage, deadline,
      ...awardDetails
    });

    if (newProj) {
      alert(`Project ${newProj.code} added to database successfully!`);
      document.getElementById('add-project-form').reset();
      
      ['Rooftop', 'Farm', 'Floating', 'Carpark', 'BESS'].forEach(sys => {
        const wrapper = document.getElementById(`project-capacity-${sys}-wrapper`);
        if (wrapper) wrapper.style.display = 'none';
      });

      // Remove custom systems from the form container
      const addContainer = document.getElementById('add-project-systems-container');
      if (addContainer) {
        addContainer.querySelectorAll('.custom-system-item').forEach(item => item.remove());
      }

      this.updateViews();
      this.switchPage('pipeline');
    }
  }

  handleMemberSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('member-name').value;
    const role = document.getElementById('member-role').value;

    if (name) {
      window.db.addMember(name, role);
      document.getElementById('add-member-form').reset();
      this.updateViews();
    }
  }

  handleHolidaySubmit(e) {
    e.preventDefault();
    const date = document.getElementById('holiday-date').value;
    const name = document.getElementById('holiday-name').value;

    if (date && name) {
      window.db.addHoliday(date, name);
      document.getElementById('add-holiday-form').reset();
      this.updateViews();
    }
  }

  handleDeleteMember(id) {
    if (confirm('Are you sure you want to delete this member? All projects assigned to them will be set to Unassigned and their manhours record will be cleared.')) {
      window.db.deleteMember(id);
      this.updateViews();
    }
  }

  handleDeleteHoliday(id) {
    if (confirm('Are you sure you want to delete this company holiday?')) {
      window.db.deleteHoliday(id);
      this.updateViews();
    }
  }

  handleDeleteProject(id) {
    if (confirm('Are you sure you want to permanently delete this project from the database? This action cannot be undone.')) {
      const success = window.db.deleteProject(id);
      if (success) {
        const modalEl = document.getElementById('editProjectModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        this.updateViews();
      }
    }
  }

  // --- Helper methods for Weather and Deliverables V10 ---

  getMockWeather(region) {
    const today = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weatherList = [];
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Today' : daysOfWeek[d.getDay()];
      
      let temp = 32;
      let icon = 'fa-sun text-warning';
      let desc = 'Sunny';
      let wind = '12 km/h';
      
      if (region === 'South') {
        if (i % 2 === 0) {
          temp = 27;
          icon = 'fa-cloud-showers-heavy text-info';
          desc = 'Heavy Rain';
          wind = '18 km/h';
        } else {
          temp = 29;
          icon = 'fa-cloud-sun-rain text-primary';
          desc = 'Passing Showers';
          wind = '15 km/h';
        }
      } else if (region === 'North') {
        temp = 24 + (i % 3);
        icon = i % 2 === 0 ? 'fa-sun text-warning' : 'fa-cloud-sun text-warning';
        desc = i % 2 === 0 ? 'Clear' : 'Partly Cloudy';
        wind = '8 km/h';
      } else {
        temp = 33 + (i % 3);
        icon = i % 3 === 0 ? 'fa-sun text-warning' : (i % 3 === 1 ? 'fa-cloud-sun text-warning' : 'fa-cloud text-secondary');
        desc = i % 3 === 0 ? 'Sunny' : (i % 3 === 1 ? 'Partly Cloudy' : 'Cloudy');
        wind = '10 km/h';
      }
      
      weatherList.push({ dayName, temp: `${temp}°C`, icon, desc, wind });
    }
    return weatherList;
  }

  renderDeliverables(containerId, deliverables) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    deliverables.forEach(d => {
      this.appendDeliverableItem(containerId, d);
    });
  }

  appendDeliverableItem(containerId, d) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'col-md-6 col-lg-4 deliverable-item';
    itemEl.setAttribute('data-name', d.name);
    
    const uniqId = 'del-' + Math.random().toString(36).substring(2, 9);
    
    itemEl.innerHTML = `
      <div class="card deliverable-card border-success-subtle h-100 p-2.5" style="background: rgba(2, 87, 37, 0.02); border-radius: 8px;">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="form-check m-0">
            <input class="form-check-input deliverable-chk" type="checkbox" ${d.checked ? 'checked' : ''} id="${uniqId}">
            <label class="form-check-label fw-bold text-success fs-7" for="${uniqId}" style="cursor: pointer; font-size: 12px;">${d.name}</label>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted" style="font-size: 11px;">Hours:</span>
          <input type="number" class="form-control form-control-sm deliverable-hours border-success text-center" style="width: 70px; font-size: 12px; height: 26px;" value="${d.hours}" min="0">
        </div>
      </div>
    `;
    container.appendChild(itemEl);
  }

  readDeliverablesFromDom(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const items = [];
    container.querySelectorAll('.deliverable-item').forEach(itemEl => {
      const name = itemEl.getAttribute('data-name');
      const checked = itemEl.querySelector('.deliverable-chk').checked;
      const hours = parseFloat(itemEl.querySelector('.deliverable-hours').value) || 0;
      items.push({ name, hours, checked });
    });
    return items;
  }

  appendCustomSystemItem(containerId, name, capacity = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const btnCol = container.querySelector('.col-12');
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 custom-system-item';
    col.setAttribute('data-system-name', name);
    
    const prefix = containerId.startsWith('edit') ? 'edit-project' : 'project';
    const cleanSystemIdName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqId = `${prefix}-system-${cleanSystemIdName}`;
    const wrapperId = `${prefix}-capacity-${cleanSystemIdName}-wrapper`;
    const capId = `${prefix}-capacity-${cleanSystemIdName}`;
    
    const isChecked = capacity !== '' && capacity > 0;
    
    col.innerHTML = `
      <div class="system-row-item">
        <div class="form-check">
          <input class="form-check-input custom-system-chk" type="checkbox" id="${uniqId}" value="${name}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label fw-semibold" for="${uniqId}" style="cursor: pointer;">${name}</label>
        </div>
        <div id="${wrapperId}" class="system-capacity-input" style="display: ${isChecked ? 'block' : 'none'};">
          <input type="number" step="0.001" min="0" class="form-control form-control-sm border-success text-end custom-system-cap" id="${capId}" placeholder="0.00 MW" value="${capacity}">
        </div>
        <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2 border-0 remove-custom-sys-btn" style="position: absolute; right: 8px; top: 2px; font-size: 10px;" onclick="this.closest('.custom-system-item').remove()"><i class="fas fa-times"></i></button>
      </div>
    `;
    
    const chk = col.querySelector('.custom-system-chk');
    const wrap = col.querySelector('.system-capacity-input');
    const capInput = col.querySelector('.custom-system-cap');
    
    chk.addEventListener('change', (e) => {
      wrap.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
        capInput.value = '';
      }
    });
    
    if (btnCol) {
      container.insertBefore(col, btnCol);
    } else {
      container.appendChild(col);
    }
  }

  readSystemsFromDom(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};
    
    const systems = {};
    const prefix = containerId.startsWith('edit') ? 'edit-project' : 'project';
    
    // Standard systems
    ['Rooftop', 'Farm', 'Floating', 'Carpark', 'BESS'].forEach(sys => {
      const chk = document.getElementById(`${prefix}-system-${sys}`);
      if (chk && chk.checked) {
        const capInput = document.getElementById(`${prefix}-capacity-${sys}`);
        systems[sys] = parseFloat(capInput.value) || 0;
      }
    });
    
    // Custom systems
    container.querySelectorAll('.custom-system-item').forEach(itemCol => {
      const name = itemCol.getAttribute('data-system-name');
      const chk = itemCol.querySelector('.custom-system-chk');
      const capInput = itemCol.querySelector('.custom-system-cap');
      if (chk && chk.checked) {
        systems[name] = parseFloat(capInput.value) || 0;
      }
    });
    
    return systems;
  }

  showAwardDetailsModal(projectId, currentData, onSaveCallback, onCancelCallback) {
    const modalEl = document.getElementById('awardDetailsModal');
    if (!modalEl) return;

    document.getElementById('award-project-id').value = projectId || '';
    
    // Fill inputs
    document.getElementById('award-construction-date').value = currentData.constructionDate || '';
    document.getElementById('award-cod-date').value = currentData.codDate || '';
    document.getElementById('award-pr-test').value = currentData.prTest || '';
    document.getElementById('award-pv').value = currentData.pv || '';
    document.getElementById('award-inverter').value = currentData.inverter || '';
    document.getElementById('award-note').value = currentData.awardNote || '';

    const form = document.getElementById('award-details-form');
    let isSaved = false;

    // Reset submit handler
    form.onsubmit = (e) => {
      e.preventDefault();
      isSaved = true;
      const data = {
        constructionDate: document.getElementById('award-construction-date').value,
        codDate: document.getElementById('award-cod-date').value,
        prTest: document.getElementById('award-pr-test').value,
        pv: document.getElementById('award-pv').value,
        inverter: document.getElementById('award-inverter').value,
        awardNote: document.getElementById('award-note').value
      };
      if (onSaveCallback) onSaveCallback(data);
      
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      if (modalInstance) modalInstance.hide();
    };

    const handleCancel = () => {
      if (!isSaved && onCancelCallback) {
        onCancelCallback();
      }
      modalEl.removeEventListener('hidden.bs.modal', handleCancel);
    };

    // Remove any existing event listeners before adding a new one
    modalEl.removeEventListener('hidden.bs.modal', handleCancel);
    modalEl.addEventListener('hidden.bs.modal', handleCancel);
    
    const cancelBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        if (onCancelCallback) onCancelCallback();
        modalEl.removeEventListener('hidden.bs.modal', handleCancel);
      };
    }

    const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modalInstance.show();
  }

  searchMap(mapType) {
    const inputId = mapType === 'portfolio' ? 'portfolio-map-search' : 'overview-map-search';
    const map = mapType === 'portfolio' ? this.portfolioMap : this.overviewMap;
    const inputVal = document.getElementById(inputId).value.trim();
    if (!inputVal) return;

    const isUrl = /^(https?:\/\/|www\.)|google\.com|goo\.gl|maps\./i.test(inputVal);
    
    if (isUrl) {
      // 1. Try to parse coordinates from URL
      const coords = this.parseCoordinates(null, inputVal);
      if (coords.lat !== null && coords.lng !== null) {
        map.setCenter(coords);
        map.setZoom(15);
        this.placeSearchMarker(map, coords, "Location from URL");
        return;
      }

      // 2. Try to extract place name from Google Maps URL (e.g. /place/Place+Name)
      let placeMatch = inputVal.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        this.geocodeAddress(placeName, 
          (res) => {
            map.setCenter({ lat: res.lat, lng: res.lng });
            map.setZoom(15);
            this.placeSearchMarker(map, { lat: res.lat, lng: res.lng }, res.address);
          },
          (err) => {
            alert(err);
          }
        );
        return;
      }

      // 3. Handle shortened URLs (maps.app.goo.gl)
      if (inputVal.includes('maps.app.goo.gl') || inputVal.includes('goo.gl/maps')) {
        alert("Shortened Google Maps links (e.g., maps.app.goo.gl) do not contain coordinates in the URL directly.\n\nPlease type the place name, enter raw coordinates (Lat, Lng), or paste the full browser URL.");
        return;
      }

      alert("Could not parse coordinates or location from the provided URL. Please try entering the place name or raw coordinates (Lat, Lng).");
    } else {
      // 1. Try to parse raw coordinates from text
      let coords = { lat: null, lng: null };
      const hasComma = inputVal.includes(',');
      const spaceParts = inputVal.split(/\s+/);
      
      if (hasComma || spaceParts.length === 2) {
        coords = this.parseCoordinates(inputVal, null);
      }

      if (coords.lat !== null && coords.lng !== null) {
        map.setCenter(coords);
        map.setZoom(15);
        this.placeSearchMarker(map, coords, `Coordinates: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        return;
      }

      // 2. Geocode place name
      this.geocodeAddress(inputVal, 
        (res) => {
          map.setCenter({ lat: res.lat, lng: res.lng });
          map.setZoom(15);
          this.placeSearchMarker(map, { lat: res.lat, lng: res.lng }, res.address);
        },
        (err) => {
          alert(err);
        }
      );
    }
  }

  geocodeAddress(address, onSuccess, onError) {
    // Try Google Maps Geocoder first
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          onSuccess({
            lat: loc.lat(),
            lng: loc.lng(),
            address: results[0].formatted_address
          });
        } else {
          console.warn('Google Geocoder failed with status:', status, 'Trying OpenStreetMap Nominatim...');
          this.geocodeAddressOSM(address, onSuccess, onError);
        }
      });
    } else {
      console.warn('Google Geocoder not available. Trying OpenStreetMap Nominatim...');
      this.geocodeAddressOSM(address, onSuccess, onError);
    }
  }

  geocodeAddressOSM(address, onSuccess, onError) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1';
    fetch(url, {
      headers: {
        'Accept-Language': 'en,th',
        'User-Agent': 'IamGungProjectDashboard/1.0'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          onSuccess({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          });
        } else {
          onError('Location not found. Please verify spelling or try coordinates (Lat, Lng).');
        }
      })
      .catch(err => {
        console.error('OSM Geocoding error:', err);
        onError('Geocoding service unavailable. Please check coordinates or try again later.');
      });
  }

  placeSearchMarker(map, coords, title) {
    // Determine which marker to clear/create
    const markerKey = map === this.portfolioMap ? 'portfolioSearchMarker' : 'overviewSearchMarker';
    
    if (this[markerKey]) {
      this[markerKey].setMap(null);
    }

    // Custom marker icon (orange pin for search result)
    const pinColor = '#ea580c';
    this[markerKey] = new google.maps.Marker({
      position: coords,
      map: map,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: {
        url: this.getPinIconSvg(pinColor),
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 36)
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div class="map-info-window" style="color: #1a251f; padding: 6px; max-width: 260px;">
        <h6 style="font-weight: 700; margin-bottom: 8px; color: #d35400;"><i class="fas fa-search me-2"></i>Search Result</h6>
        <p class="fw-bold" style="margin-bottom: 4px; font-size: 13px;">${title}</p>
        <p class="text-muted" style="margin-bottom: 4px; font-size: 11px;">Coordinates: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}</p>
      </div>`
    });

    this[markerKey].addListener('click', () => {
      infoWindow.open(map, this[markerKey]);
    });

    infoWindow.open(map, this[markerKey]);
  }

  getFilteredPipelineProjects() {
    const searchStr = (document.getElementById('pipeline-search').value || '').toLowerCase();
    const region = document.getElementById('pipeline-filter-region').value;
    const investor = document.getElementById('pipeline-filter-investor').value;
    const business = document.getElementById('pipeline-filter-business').value;
    const sortVal = document.getElementById('pipeline-sort') ? document.getElementById('pipeline-sort').value : 'nearest';

    let projects = window.db.getProjects();

    // Filters
    if (searchStr) {
      projects = projects.filter(p => 
        p.code.toLowerCase().includes(searchStr) || 
        p.name.toLowerCase().includes(searchStr) || 
        p.client.toLowerCase().includes(searchStr)
      );
    }
    if (region) projects = projects.filter(p => p.region === region);
    if (investor) projects = projects.filter(p => p.investor === investor);
    if (business) projects = projects.filter(p => p.businessType === business);

    // Sorting
    if (sortVal === 'nearest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const bd = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return ad - bd;
      });
    } else if (sortVal === 'latest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(0);
        const bd = b.deadline ? new Date(b.deadline) : new Date(0);
        return bd - ad;
      });
    } else if (sortVal === 'code') {
      projects.sort((a, b) => a.code.localeCompare(b.code));
    }
    return projects;
  }

  getFilteredAwardedProjects() {
    const searchStr = (document.getElementById('awarded-pipeline-search').value || '').toLowerCase();
    const region = document.getElementById('awarded-pipeline-filter-region').value;
    const investor = document.getElementById('awarded-pipeline-filter-investor').value;
    const business = document.getElementById('awarded-pipeline-filter-business').value;
    const sortVal = document.getElementById('awarded-pipeline-sort') ? document.getElementById('awarded-pipeline-sort').value : 'nearest';

    let projects = window.db.getAwardedProjects();

    // Filters
    if (searchStr) {
      projects = projects.filter(p => 
        p.code.toLowerCase().includes(searchStr) || 
        p.name.toLowerCase().includes(searchStr) || 
        p.client.toLowerCase().includes(searchStr)
      );
    }
    if (region) projects = projects.filter(p => p.region === region);
    if (investor) projects = projects.filter(p => p.investor === investor);
    if (business) projects = projects.filter(p => p.businessType === business);

    // Sorting
    if (sortVal === 'nearest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const bd = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return ad - bd;
      });
    } else if (sortVal === 'latest') {
      projects.sort((a, b) => {
        const ad = a.deadline ? new Date(a.deadline) : new Date(0);
        const bd = b.deadline ? new Date(b.deadline) : new Date(0);
        return bd - ad;
      });
    } else if (sortVal === 'code') {
      projects.sort((a, b) => a.code.localeCompare(b.code));
    }
    return projects;
  }

  exportPipeline(format) {
    const projects = this.getFilteredPipelineProjects();
    const members = window.db.getMembers();
    
    if (format === 'excel') {
      const headers = ['Project Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Business Type', 'Client', 'Systems (Capacity)', 'Total Capacity (MW)', 'Coordinates', 'Google Maps Link', 'Due Date', 'Status', 'Stage'];
      const rows = projects.map(p => {
        const eng = members.find(m => m.id === p.engineer);
        const engName = eng ? eng.name : 'Unassigned';
        const systemsStr = p.systems ? Object.entries(p.systems).map(([name, cap]) => `${name} (${(cap * 1000).toFixed(0)} ${name === 'BESS' ? 'kWh' : 'kWp'})`).join('; ') : '';
        const coordsStr = (p.lat !== null && p.lng !== null) ? `${p.lat}, ${p.lng}` : '';
        return [p.code, p.name, p.region, engName, p.investor, p.businessType, p.client, systemsStr, p.capacity, coordsStr, p.googleMapsLink || '', p.deadline, p.status, p.stage];
      });
      this.downloadCSV('project_pipeline', headers, rows);
    } else if (format === 'html') {
      const headers = ['Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Type', 'Client', 'Capacity (MW)', 'Due Date', 'Status', 'Stage'];
      const rows = projects.map(p => {
        const eng = members.find(m => m.id === p.engineer);
        const engName = eng ? eng.name : 'Unassigned';
        return [p.code, p.name, p.region, engName, p.investor, p.businessType, p.client, p.capacity.toFixed(2), this.formatDate(p.deadline), p.status, p.stage];
      });
      this.downloadHTML('Project Pipeline Report', 'List of renewable energy projects in pipeline', headers, rows);
    } else if (format === 'pdf') {
      this.downloadPDF('Project Pipeline Report', 'List of renewable energy projects in pipeline', 'pipeline-table-body', ['Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Type', 'Client', 'Systems', 'Capacity', 'Maps', 'Due Date', 'Status', 'Stage']);
    }
  }

  exportAwarded(format) {
    const projects = this.getFilteredAwardedProjects();
    const members = window.db.getMembers();
    
    if (format === 'excel') {
      const headers = ['Project Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Business Type', 'Client', 'Systems (Capacity)', 'Total Capacity (MW)', 'Coordinates', 'Google Maps Link', 'Due Date', 'Status', 'Stage', 'Construction Date', 'COD Date', 'PR Test', 'PV', 'Inverter', 'Award Note'];
      const rows = projects.map(p => {
        const eng = members.find(m => m.id === p.engineer);
        const engName = eng ? eng.name : 'Unassigned';
        const systemsStr = p.systems ? Object.entries(p.systems).map(([name, cap]) => `${name} (${(cap * 1000).toFixed(0)} ${name === 'BESS' ? 'kWh' : 'kWp'})`).join('; ') : '';
        const coordsStr = (p.lat !== null && p.lng !== null) ? `${p.lat}, ${p.lng}` : '';
        return [p.code, p.name, p.region, engName, p.investor, p.businessType, p.client, systemsStr, p.capacity, coordsStr, p.googleMapsLink || '', p.deadline, p.status, p.stage, p.constructionDate || '', p.codDate || '', p.prTest || '', p.pv || '', p.inverter || '', p.awardNote || ''];
      });
      this.downloadCSV('project_awarded', headers, rows);
    } else if (format === 'html') {
      const headers = ['Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Type', 'Client', 'Capacity (MW)', 'Due Date', 'COD Date', 'PV', 'Inverter', 'Status'];
      const rows = projects.map(p => {
        const eng = members.find(m => m.id === p.engineer);
        const engName = eng ? eng.name : 'Unassigned';
        return [p.code, p.name, p.region, engName, p.investor, p.businessType, p.client, p.capacity.toFixed(2), this.formatDate(p.deadline), this.formatDate(p.codDate), p.pv || '-', p.inverter || '-', p.status];
      });
      this.downloadHTML('Project Awarded Report', 'List of awarded renewable energy projects', headers, rows);
    } else if (format === 'pdf') {
      this.downloadPDF('Project Awarded Report', 'List of awarded renewable energy projects', 'awarded-pipeline-table-body', ['Code', 'Project Name', 'Region', 'BD Engineer', 'Investor', 'Type', 'Client', 'Systems', 'Capacity', 'Maps', 'Due Date', 'Status', 'Stage']);
    }
  }

  downloadCSV(filename, headers, rows) {
    const escapeField = (field) => {
      if (field === null || field === undefined) return '';
      let str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    
    let csvContent = headers.map(escapeField).join(',') + '\r\n';
    rows.forEach(row => {
      csvContent += row.map(escapeField).join(',') + '\r\n';
    });
    
    // Prepend UTF-8 BOM to resolve Thai characters issues in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadHTML(title, subtitle, headers, rows) {
    let tableHeadersHtml = headers.map(h => `<th>${h}</th>`).join('');
    let tableRowsHtml = rows.map(row => {
      return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgTheme = isDark ? '#0b1610' : '#f8fafc';
    const cardBg = isDark ? '#112218' : '#ffffff';
    const textColor = isDark ? '#e2ece6' : '#1e293b';
    const borderCol = isDark ? '#1a3324' : '#e2e8f0';
    const primaryCol = '#025725';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px;
      background-color: ${bgTheme};
      color: ${textColor};
    }
    .report-card {
      background: ${cardBg};
      border: 1px solid ${borderCol};
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    h1 {
      color: ${primaryCol};
      margin-top: 0;
      margin-bottom: 5px;
      font-size: 24px;
    }
    p.subtitle {
      color: #64748b;
      margin-top: 0;
      margin-bottom: 25px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid ${borderCol};
      font-size: 13px;
    }
    th {
      background-color: ${primaryCol};
      color: #ffffff;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    tr:hover {
      background-color: rgba(2, 87, 37, 0.03);
    }
    .footer {
      margin-top: 30px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="report-card">
    <h1>${title}</h1>
    <p class="subtitle">${subtitle} l Generated on ${new Date().toLocaleString()}</p>
    <table>
      <thead>
        <tr>${tableHeadersHtml}</tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
    <div class="footer">
      Generated automatically by Project Dashboard Dashboard Systems. l Copyright &copy; 2026.
    </div>
  </div>
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadPDF(title, subtitle, tbodyId, headers) {
    const element = document.createElement('div');
    element.className = 'p-4 bg-white text-dark';
    element.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    
    // Title header
    const header = document.createElement('div');
    header.className = 'mb-4 border-bottom pb-2';
    header.innerHTML = `
      <h2 style="color: #025725; font-weight: 700; margin-bottom: 4px;">${title}</h2>
      <p style="color: #64748b; font-size: 12px; margin: 0;">${subtitle} | Date: ${new Date().toLocaleDateString()}</p>
    `;
    element.appendChild(header);
    
    // Table container
    const table = document.createElement('table');
    table.className = 'table table-bordered align-middle';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '9px';
    
    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = \`<tr style="background-color: #025725; color: #ffffff;">\${headers.map(h => \`<th style="padding: 6px; border: 1px solid #dee2e6; text-align: left;">\${h}</th>\`).join('')}</tr>\`;
    table.appendChild(thead);
    
    // Copy table rows from DOM
    const tbody = document.createElement('tbody');
    const originalRows = document.querySelectorAll(\`#\${tbodyId} tr\`);
    
    originalRows.forEach(origRow => {
      const clonedRow = document.createElement('tr');
      origRow.querySelectorAll('td').forEach(origTd => {
        const clonedTd = document.createElement('td');
        clonedTd.style.padding = '6px';
        clonedTd.style.border = '1px solid #dee2e6';
        
        // Clean up contents
        const mapBtn = origTd.querySelector('.btn-outline-success');
        const badgeSpan = origTd.querySelectorAll('.badge');
        const editLink = origTd.querySelector('a');
        
        if (mapBtn) {
          clonedTd.textContent = mapBtn.textContent.trim() || 'Link';
        } else if (badgeSpan && badgeSpan.length > 0) {
          const badgeTexts = [];
          badgeSpan.forEach(b => badgeTexts.push(b.textContent.trim()));
          clonedTd.textContent = badgeTexts.join(', ');
        } else if (editLink) {
          clonedTd.textContent = editLink.textContent.trim();
          clonedTd.style.fontWeight = 'bold';
        } else {
          clonedTd.textContent = origTd.textContent.trim();
        }
        
        if (origTd.classList.contains('text-end')) {
          clonedTd.style.textAlign = 'right';
        } else if (origTd.classList.contains('text-center')) {
          clonedTd.style.textAlign = 'center';
        }
        
        clonedRow.appendChild(clonedTd);
      });
      tbody.appendChild(clonedRow);
    });
    
    table.appendChild(tbody);
    element.appendChild(table);
    
    const footer = document.createElement('div');
    footer.className = 'text-center mt-3';
    footer.style.fontSize = '8px';
    footer.style.color = '#94a3b8';
    footer.textContent = 'Generated from Project Dashboard. page 1 of 1';
    element.appendChild(footer);
    
    document.body.appendChild(element);
    
    const opt = {
      margin: 8,
      filename: `\${title.toLowerCase().replace(/\\s+/g, '_')}_\${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    }).catch(err => {
      console.error('PDF generation failed:', err);
      document.body.removeChild(element);
    });
  }
}

// Instantiate App
window.app = new DashboardApp();
window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
