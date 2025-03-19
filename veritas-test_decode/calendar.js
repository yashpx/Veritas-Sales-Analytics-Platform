// VeritasSalesCalendar - A Microsoft Teams-inspired calendar for sales representatives
class VeritasSalesCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }
    
    // Default options
    this.options = {
      firstDayOfWeek: 0, // 0 = Sunday, 1 = Monday, etc.
      startDayHour: 0, // Start hour for day/week view (0-23)
      endDayHour: 24, // End hour for day/week view (1-24)
      timeSlotDuration: 60, // Duration of time slots in minutes
      defaultView: 'week', // 'day', 'week', or 'month'
      enableDragAndDrop: true, // Allow events to be dragged and dropped
      enableNotifications: true, // Enable browser notifications for reminders
      supabaseEnabled: false, // Whether to use Supabase for data storage
      supabaseTable: 'calendar_events', // Supabase table name for events
      eventTypes: [
        { id: 'follow-up', name: 'Follow-up Call', color: '#4CAF50', visible: true },
        { id: 'meeting', name: 'Client Meeting', color: '#2196F3', visible: true },
        { id: 'demo', name: 'Product Demo', color: '#FF9800', visible: true },
        { id: 'training', name: 'Training Session', color: '#9C27B0', visible: true },
        { id: 'other', name: 'Other', color: '#607D8B', visible: true }
      ],
      ...options
    };
    
    // State
    this.currentDate = new Date();
    this.currentView = this.options.defaultView;
    this.events = [];
    this.supabaseClient = null;
    
    // Initialize
    this.initializeUI();
    this.setupEventListeners();
    this.initializeSupabase();
    this.loadEvents();
    this.renderCalendar();
  }
  
  // Initialize Supabase if enabled
  async initializeSupabase() {
    if (this.options.supabaseEnabled) {
      try {
        // Check if supabase-js is loaded
        if (typeof supabase === 'undefined') {
          // Load Supabase JS library dynamically
          await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        }
        
        // Get Supabase URL and key from data attributes or environment
        const supabaseUrl = this.container.dataset.supabaseUrl || 'https://coghrwmmyyzmbnndlawi.supabase.co';
        const supabaseKey = this.container.dataset.supabaseKey || '';
        
        if (!supabaseKey) {
          console.error('Supabase key is not provided. Events will be stored locally only.');
          return;
        }
        
        // Create Supabase client
        this.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
      }
    }
  }
  
  // Load script dynamically
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize the UI structure
  initializeUI() {
    this.container.innerHTML = `
      <div class="veritas-calendar">
        <div class="calendar-header">
          <div class="calendar-title">
            <h1>Calendar</h1>
          </div>
          <div class="calendar-nav">
            <button class="nav-btn today-btn">Today</button>
            <button class="nav-btn prev-btn">&lt;</button>
            <button class="nav-btn next-btn">&gt;</button>
            <span class="current-date-display"></span>
          </div>
          <div class="calendar-views">
            <button class="view-btn week-view-btn">Week</button>
            <button class="view-btn month-view-btn">Month</button>
          </div>
          <div class="calendar-actions">
            <button class="action-btn new-event-btn">+ New Event</button>
          </div>
        </div>
        <div class="calendar-sidebar">
          <div class="event-types-filter">
            <h3>Event Types</h3>
            <ul class="event-type-list"></ul>
          </div>
          <div class="upcoming-events">
            <h3>Upcoming Events</h3>
            <div class="upcoming-events-list"></div>
          </div>
        </div>
        <div class="calendar-main">
          <div class="calendar-grid-container">
            <div class="calendar-grid"></div>
          </div>
        </div>
        <div class="event-modal" style="display: none;">
          <div class="event-modal-content">
            <span class="close-modal">&times;</span>
            <h2 class="modal-title">Add New Event</h2>
            <form id="event-form">
              <div class="form-group">
                <label for="event-title">Title</label>
                <input type="text" id="event-title" required>
              </div>
              <div class="form-group">
                <label for="event-type">Event Type</label>
                <select id="event-type"></select>
              </div>
              <div class="form-group">
                <label for="event-start">Start</label>
                <input type="datetime-local" id="event-start" required>
              </div>
              <div class="form-group">
                <label for="event-end">End</label>
                <input type="datetime-local" id="event-end" required>
              </div>
              <div class="form-group">
                <label for="event-client">Client</label>
                <input type="text" id="event-client">
              </div>
              <div class="form-group">
                <label for="event-notes">Notes</label>
                <textarea id="event-notes"></textarea>
              </div>
              <div class="form-group">
                <label for="event-reminder">Reminder</label>
                <select id="event-reminder">
                  <option value="0">None</option>
                  <option value="5">5 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
        <div class="notification-container"></div>
      </div>
    `;
    
    // Populate event types
    const eventTypeList = this.container.querySelector('.event-type-list');
    const eventTypeSelect = this.container.querySelector('#event-type');
    
    this.options.eventTypes.forEach(type => {
      // Add to sidebar filter
      const li = document.createElement('li');
      li.innerHTML = `
        <label>
          <input type="checkbox" data-type="${type.id}" checked>
          <span class="event-type-color" style="background-color: ${type.color}"></span>
          <span class="event-type-name">${type.name}</span>
        </label>
      `;
      eventTypeList.appendChild(li);
      
      // Add to event form select
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.name;
      eventTypeSelect.appendChild(option);
    });
  }
  
  // Load events from Supabase or localStorage
  async loadEvents() {
    // First try to load from Supabase if enabled
    if (this.options.supabaseEnabled && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from(this.options.supabaseTable)
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Convert date strings to Date objects
          this.events = data.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
          console.log('Events loaded from Supabase:', this.events.length);
          this.renderCalendar();
          return;
        }
      } catch (error) {
        console.error('Failed to load events from Supabase:', error);
      }
    }
    
    // Fallback to localStorage if Supabase failed or is not enabled
    try {
      const savedEvents = localStorage.getItem('veritasCalendarEvents');
      if (savedEvents) {
        // Parse the saved events and convert date strings back to Date objects
        const parsedEvents = JSON.parse(savedEvents);
        this.events = parsedEvents.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
      } else {
        // Sample events if no saved events exist
        this.events = [
          {
            id: 1,
            title: 'Follow-up with Acme Corp',
            type: 'follow-up',
            start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate(), 10, 0),
            end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate(), 10, 30),
            client: 'Acme Corp',
            notes: 'Discuss new product features',
            reminder: 15
          },
          {
            id: 2,
            title: 'Product Demo for TechStart',
            type: 'demo',
            start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1, 14, 0),
            end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1, 15, 0),
            client: 'TechStart',
            notes: 'Show new dashboard features',
            reminder: 30
          },
          {
            id: 3,
            title: 'Quarterly Review Meeting',
            type: 'meeting',
            start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 2, 11, 0),
            end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 2, 12, 30),
            client: 'Internal',
            notes: 'Review Q1 sales targets',
            reminder: 60
          }
        ];
      }
    } catch (e) {
      console.error('Failed to load events from localStorage:', e);
      // Fallback to sample events
      this.events = [
        {
          id: 1,
          title: 'Follow-up with Acme Corp',
          type: 'follow-up',
          start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate(), 10, 0),
          end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate(), 10, 30),
          client: 'Acme Corp',
          notes: 'Discuss new product features',
          reminder: 15
        },
        {
          id: 2,
          title: 'Product Demo for TechStart',
          type: 'demo',
          start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1, 14, 0),
          end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1, 15, 0),
          client: 'TechStart',
          notes: 'Show new dashboard features',
          reminder: 30
        },
        {
          id: 3,
          title: 'Quarterly Review Meeting',
          type: 'meeting',
          start: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 2, 11, 0),
          end: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 2, 12, 30),
          client: 'Internal',
          notes: 'Review Q1 sales targets',
          reminder: 60
        }
      ];
    }
  }

  // Render the calendar based on current view
  renderCalendar() {
    this.updateDateDisplay();
    
    if (this.currentView === 'week') {
      this.renderWeekView();
    } else {
      this.renderMonthView();
    }
    
    this.renderUpcomingEvents();
  }

  // Update the date display in the header
  updateDateDisplay() {
    const dateDisplay = this.container.querySelector('.current-date-display');
    
    if (this.currentView === 'week') {
      const weekStart = this.getWeekStartDate(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatOptions = { month: 'long', day: 'numeric' };
      const startStr = weekStart.toLocaleDateString('en-US', formatOptions);
      const endStr = weekEnd.toLocaleDateString('en-US', formatOptions);
      
      dateDisplay.textContent = `${startStr} - ${endStr}, ${weekEnd.getFullYear()}`;
    } else {
      dateDisplay.textContent = this.currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  }

  // Render week view
  renderWeekView() {
    const grid = this.container.querySelector('.calendar-grid');
    grid.innerHTML = '';
    grid.className = 'calendar-grid week-view';
    
    const weekStart = this.getWeekStartDate(this.currentDate);
    const hours = Array.from({ length: this.options.endDayHour - this.options.startDayHour }, 
                            (_, i) => this.options.startDayHour + i);
    
    // Create header row with days
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row header-row';
    
    // Time gutter header
    const timeGutterHeader = document.createElement('div');
    timeGutterHeader.className = 'grid-cell time-gutter-header';
    headerRow.appendChild(timeGutterHeader);
    
    // Day headers
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'grid-cell day-header';
      
      const isToday = this.isSameDay(day, new Date());
      if (isToday) {
        dayHeader.classList.add('today');
      }
      
      dayHeader.innerHTML = `
        <div class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        <div class="day-number">${day.getDate()}</div>
      `;
      
      headerRow.appendChild(dayHeader);
    }
    
    grid.appendChild(headerRow);
    
    // Create time rows
    hours.forEach(hour => {
      const timeRow = document.createElement('div');
      timeRow.className = 'grid-row time-row';
      
      // Time label
      const timeLabel = document.createElement('div');
      timeLabel.className = 'grid-cell time-label';
      timeLabel.textContent = `${hour}:00`;
      timeRow.appendChild(timeLabel);
      
      // Day cells
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        
        const cell = document.createElement('div');
        cell.className = 'grid-cell day-cell';
        cell.dataset.date = day.toISOString().split('T')[0];
        cell.dataset.hour = hour;
        
        // Check if this cell is today
        if (this.isSameDay(day, new Date())) {
          cell.classList.add('today');
        }
        
        timeRow.appendChild(cell);
      }
      
      grid.appendChild(timeRow);
    });
    
    // Render events
    this.renderEvents();
  }

  // Render month view
  renderMonthView() {
    const grid = this.container.querySelector('.calendar-grid');
    grid.innerHTML = '';
    grid.className = 'calendar-grid month-view';
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month and how many days to show from previous month
    const firstDay = new Date(year, month, 1).getDay();
    const daysFromPrevMonth = (firstDay - this.options.firstDayOfWeek + 7) % 7;
    
    // Get number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get number of days from next month to show
    const totalCells = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalCells - daysInMonth - daysFromPrevMonth;
    
    // Create header row with weekday names
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row weekday-header';
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (this.options.firstDayOfWeek + i) % 7;
      const dayName = new Date(2021, 0, 3 + dayIndex).toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'grid-cell weekday-name';
      dayHeader.textContent = dayName;
      
      headerRow.appendChild(dayHeader);
    }
    
    grid.appendChild(headerRow);
    
    // Create date grid
    let currentRow = document.createElement('div');
    currentRow.className = 'grid-row';
    
    // Previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    
    for (let i = 0; i < daysFromPrevMonth; i++) {
      const day = daysInPrevMonth - daysFromPrevMonth + i + 1;
      const date = new Date(prevMonthYear, prevMonth, day);
      
      const cell = document.createElement('div');
      cell.className = 'grid-cell month-cell other-month';
      cell.dataset.date = date.toISOString().split('T')[0];
      cell.innerHTML = `<div class="date-number">${day}</div><div class="events-container"></div>`;
      
      currentRow.appendChild(cell);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      if (currentRow.children.length === 7) {
        grid.appendChild(currentRow);
        currentRow = document.createElement('div');
        currentRow.className = 'grid-row';
      }
      
      const date = new Date(year, month, day);
      const isToday = this.isSameDay(date, new Date());
      
      const cell = document.createElement('div');
      cell.className = `grid-cell month-cell${isToday ? ' today' : ''}`;
      cell.dataset.date = date.toISOString().split('T')[0];
      cell.innerHTML = `<div class="date-number">${day}</div><div class="events-container"></div>`;
      
      currentRow.appendChild(cell);
    }
    
    // Next month days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= daysFromNextMonth; day++) {
      if (currentRow.children.length === 7) {
        grid.appendChild(currentRow);
        currentRow = document.createElement('div');
        currentRow.className = 'grid-row';
      }
      
      const date = new Date(nextMonthYear, nextMonth, day);
      
      const cell = document.createElement('div');
      cell.className = 'grid-cell month-cell other-month';
      cell.dataset.date = date.toISOString().split('T')[0];
      cell.innerHTML = `<div class="date-number">${day}</div><div class="events-container"></div>`;
      
      currentRow.appendChild(cell);
    }
    
    // Add the last row if it has any cells
    if (currentRow.children.length > 0) {
      grid.appendChild(currentRow);
    }
    
    // Render events
    this.renderEvents();
  }

  // Render events on the calendar
  renderEvents() {
    // Clear existing events
    const eventElements = this.container.querySelectorAll('.calendar-event');
    eventElements.forEach(el => el.remove());
    
    // Filter events based on selected types
    const checkedTypes = Array.from(
      this.container.querySelectorAll('.event-type-list input:checked')
    ).map(input => input.dataset.type);
    
    const filteredEvents = this.events.filter(event => checkedTypes.includes(event.type));
    
    if (this.currentView === 'week') {
      this.renderWeekViewEvents(filteredEvents);
    } else {
      this.renderMonthViewEvents(filteredEvents);
    }
  }

  // Render events in week view
  renderWeekViewEvents(events) {
    const weekStart = this.getWeekStartDate(this.currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    // Filter events for this week
    const weekEvents = events.filter(event => 
      event.start >= weekStart && event.start < weekEnd
    );
    
    weekEvents.forEach(event => {
      const eventType = this.options.eventTypes.find(type => type.id === event.type);
      const eventColor = eventType ? eventType.color : '#607D8B';
      
      const dayIndex = (event.start.getDay() - this.options.firstDayOfWeek + 7) % 7;
      const startHour = event.start.getHours() + event.start.getMinutes() / 60;
      const endHour = event.end.getHours() + event.end.getMinutes() / 60;
      
      // Skip events outside visible hours
      if (endHour <= this.options.startDayHour || startHour >= this.options.endDayHour) {
        return;
      }
      
      const visibleStartHour = Math.max(startHour, this.options.startDayHour);
      const visibleEndHour = Math.min(endHour, this.options.endDayHour);
      const durationHours = visibleEndHour - visibleStartHour;
      
      // Create event element
      const eventElement = document.createElement('div');
      eventElement.className = 'calendar-event';
      eventElement.dataset.id = event.id;
      eventElement.style.backgroundColor = eventColor;
      
      // Position the event - Fixed positioning calculation
      const dayCell = this.container.querySelector(`.day-cell[data-date="${event.start.toISOString().split('T')[0]}"][data-hour="${Math.floor(visibleStartHour)}"]`);
      
      if (dayCell) {
        const cellRect = dayCell.getBoundingClientRect();
        const gridRect = this.container.querySelector('.calendar-grid').getBoundingClientRect();
        
        const top = dayCell.offsetTop + ((visibleStartHour - Math.floor(visibleStartHour)) * cellRect.height);
        const height = durationHours * cellRect.height;
        
        eventElement.style.position = 'absolute';
        eventElement.style.top = `${top}px`;
        eventElement.style.height = `${height}px`;
        eventElement.style.left = `${dayCell.offsetLeft + 2}px`;
        eventElement.style.width = `${cellRect.width - 4}px`;
        
        // Event content
        eventElement.innerHTML = `
          <div class="event-title">${event.title}</div>
          <div class="event-time">${this.formatTime(event.start)} - ${this.formatTime(event.end)}</div>
          ${event.client ? `<div class="event-client">${event.client}</div>` : ''}
        `;
        
        // Add event to grid
        this.container.querySelector('.calendar-grid').appendChild(eventElement);
        
        // Make event draggable
        this.makeEventDraggable(eventElement);
      }
    });
  }

  // Render events in month view
  renderMonthViewEvents(events) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Get visible date range (including days from prev/next month)
    const firstVisibleDate = new Date(monthStart);
    const dayOfWeek = monthStart.getDay();
    const daysToSubtract = (dayOfWeek - this.options.firstDayOfWeek + 7) % 7;
    firstVisibleDate.setDate(monthStart.getDate() - daysToSubtract);
    
    const lastVisibleDate = new Date(monthEnd);
    const lastDayOfWeek = monthEnd.getDay();
    const daysToAdd = (6 - lastDayOfWeek + this.options.firstDayOfWeek) % 7;
    lastVisibleDate.setDate(monthEnd.getDate() + daysToAdd);
    
    // Filter events for visible range
    const visibleEvents = events.filter(event => 
      event.start >= firstVisibleDate && event.start <= lastVisibleDate
    );
    
    visibleEvents.forEach(event => {
      const eventType = this.options.eventTypes.find(type => type.id === event.type);
      const eventColor = eventType ? eventType.color : '#607D8B';
      
      const dateStr = event.start.toISOString().split('T')[0];
      const cell = this.container.querySelector(`.month-cell[data-date="${dateStr}"]`);
      
      if (cell) {
        const eventsContainer = cell.querySelector('.events-container');
        
        const eventElement = document.createElement('div');
        eventElement.className = 'month-event';
        eventElement.dataset.id = event.id;
        eventElement.style.backgroundColor = eventColor;
        eventElement.innerHTML = `
          <div class="event-time">${this.formatTime(event.start)}</div>
          <div class="event-title">${event.title}</div>
        `;
        
        eventsContainer.appendChild(eventElement);
        
        // Make event draggable
        this.makeEventDraggable(eventElement);
      }
    });
  }

  // Render upcoming events in sidebar
  renderUpcomingEvents() {
    const upcomingList = this.container.querySelector('.upcoming-events-list');
    upcomingList.innerHTML = '';
    
    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);
    
    // Filter events for next two weeks
    const upcomingEvents = this.events
      .filter(event => event.start >= now && event.start <= twoWeeksLater)
      .sort((a, b) => a.start - b.start);
    
    if (upcomingEvents.length === 0) {
      upcomingList.innerHTML = '<p class="no-events">No upcoming events</p>';
      return;
    }
    
    upcomingEvents.slice(0, 5).forEach(event => {
      const eventType = this.options.eventTypes.find(type => type.id === event.type);
      const eventColor = eventType ? eventType.color : '#607D8B';
      
      const eventElement = document.createElement('div');
      eventElement.className = 'upcoming-event';
      eventElement.dataset.id = event.id;
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      let dateDisplay;
      if (this.isSameDay(event.start, today)) {
        dateDisplay = 'Today';
      } else if (this.isSameDay(event.start, tomorrow)) {
        dateDisplay = 'Tomorrow';
      } else {
        dateDisplay = event.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      
      eventElement.innerHTML = `
        <div class="event-indicator" style="background-color: ${eventColor}"></div>
        <div class="event-details">
          <div class="event-title">${event.title}</div>
          <div class="event-meta">
            <span class="event-date">${dateDisplay}</span>
            <span class="event-time">${this.formatTime(event.start)}</span>
          </div>
        </div>
      `;
      
      upcomingList.appendChild(eventElement);
    });
  }

  // Make an event draggable
  makeEventDraggable(eventElement) {
    eventElement.draggable = true;
    
    eventElement.addEventListener('dragstart', (e) => {
      this.dragState.isDragging = true;
      this.dragState.eventId = eventElement.dataset.id;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;
      
      e.dataTransfer.setData('text/plain', eventElement.dataset.id);
      eventElement.classList.add('dragging');
    });
    
    eventElement.addEventListener('dragend', () => {
      this.dragState.isDragging = false;
      eventElement.classList.remove('dragging');
    });
    
    eventElement.addEventListener('click', () => {
      this.openEventModal(parseInt(eventElement.dataset.id));
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Navigation buttons
    this.container.querySelector('.today-btn').addEventListener('click', () => {
      this.currentDate = new Date();
      this.renderCalendar();
    });
    
    this.container.querySelector('.prev-btn').addEventListener('click', () => {
      if (this.currentView === 'week') {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
      } else {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      }
      this.renderCalendar();
    });
    
    this.container.querySelector('.next-btn').addEventListener('click', () => {
      if (this.currentView === 'week') {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
      } else {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      }
      this.renderCalendar();
    });
    
    // View buttons
    this.container.querySelector('.week-view-btn').addEventListener('click', () => {
      this.currentView = 'week';
      this.renderCalendar();
    });
    
    this.container.querySelector('.month-view-btn').addEventListener('click', () => {
      this.currentView = 'month';
      this.renderCalendar();
    });
    
    // New event button
    this.container.querySelector('.new-event-btn').addEventListener('click', () => {
      const now = new Date();
      now.setMinutes(0);
      now.setSeconds(0);
      now.setMilliseconds(0);
      
      const endTime = new Date(now);
      endTime.setHours(now.getHours() + 1);
      
      this.openEventModal(null, now);
    });
    
    // Calendar grid cell click (for adding events)
    const grid = this.container.querySelector('.calendar-grid');
    grid.addEventListener('click', (e) => {
      // Check if we clicked on a day cell or month cell
      const dayCell = e.target.closest('.day-cell');
      const monthCell = e.target.closest('.month-cell');
      
      // Don't handle clicks on existing events
      if (e.target.closest('.calendar-event, .month-event')) {
        return;
      }
      
      if (dayCell) {
        // Week view cell click
        const date = new Date(dayCell.dataset.date);
        const hour = parseInt(dayCell.dataset.hour);
        
        date.setHours(hour);
        date.setMinutes(0);
        date.setSeconds(0);
        
        this.openEventModal(null, date);
      } else if (monthCell) {
        // Month view cell click
        const date = new Date(monthCell.dataset.date);
        date.setHours(9);
        date.setMinutes(0);
        date.setSeconds(0);
        
        this.openEventModal(null, date);
      }
    });
    
    // Event click
    this.container.addEventListener('click', (e) => {
      const eventElement = e.target.closest('.calendar-event, .month-event');
      if (eventElement) {
        const eventId = parseInt(eventElement.dataset.id);
        const event = this.events.find(evt => evt.id === eventId);
        if (event) {
          this.openEventModal(event);
        }
      }
    });
    
    // Modal close button
    this.container.querySelector('.close-modal').addEventListener('click', () => {
      this.container.querySelector('.event-modal').style.display = 'none';
    });
    
    // Modal cancel button
    this.container.querySelector('.cancel-btn').addEventListener('click', () => {
      this.container.querySelector('.event-modal').style.display = 'none';
    });
    
    // Modal form submit
    this.container.querySelector('#event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEvent();
    });
    
    // Event type filter
    this.container.querySelector('.event-type-list').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const typeId = e.target.value;
        const isChecked = e.target.checked;
        
        this.options.eventTypes.forEach(type => {
          if (type.id === typeId) {
            type.visible = isChecked;
          }
        });
        
        this.renderCalendar();
      }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      const modal = this.container.querySelector('.event-modal');
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Handle notification permission
    if (this.options.enableNotifications && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        this.container.querySelector('.notification-container').innerHTML = `
          <div class="notification-permission-prompt">
            <p>Enable calendar notifications?</p>
            <button class="enable-notifications-btn">Enable</button>
            <button class="dismiss-notifications-btn">No thanks</button>
          </div>
        `;
        
        this.container.querySelector('.enable-notifications-btn').addEventListener('click', () => {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              this.showNotification('Notifications enabled', 'You will now receive reminders for your events');
            }
            this.container.querySelector('.notification-permission-prompt').remove();
          });
        });
        
        this.container.querySelector('.dismiss-notifications-btn').addEventListener('click', () => {
          this.container.querySelector('.notification-permission-prompt').remove();
        });
      }
    }
  }

  // Get the start date of the week containing the given date
  getWeekStartDate(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day - this.options.firstDayOfWeek + 7) % 7;
    result.setDate(result.getDate() - diff);
    return result;
  }

  // Format time as HH:MM AM/PM
  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // Check if two dates are the same day
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Open the event modal for creating or editing an event
  openEventModal(event = null, defaultDate = null) {
    const modal = this.container.querySelector('.event-modal');
    const form = this.container.querySelector('#event-form');
    const modalTitle = this.container.querySelector('.modal-title');
    
    // Clear previous form data
    form.reset();
    
    // Set default date and time if provided
    if (defaultDate) {
      const endDate = new Date(defaultDate);
      endDate.setHours(endDate.getHours() + 1);
      
      form.querySelector('#event-start').value = this.formatDateTimeForInput(defaultDate);
      form.querySelector('#event-end').value = this.formatDateTimeForInput(endDate);
    }
    
    // Populate event type dropdown
    const eventTypeSelect = form.querySelector('#event-type');
    eventTypeSelect.innerHTML = '';
    
    this.options.eventTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = type.name;
      eventTypeSelect.appendChild(option);
    });
    
    if (event) {
      // Editing existing event
      modalTitle.textContent = 'Edit Event';
      form.dataset.eventId = event.id;
      
      form.querySelector('#event-title').value = event.title;
      form.querySelector('#event-type').value = event.type;
      form.querySelector('#event-start').value = this.formatDateTimeForInput(event.start);
      form.querySelector('#event-end').value = this.formatDateTimeForInput(event.end);
      form.querySelector('#event-client').value = event.client || '';
      form.querySelector('#event-notes').value = event.notes || '';
      form.querySelector('#event-reminder').value = event.reminder || '0';
      
      // Show delete button for existing events
      let deleteBtn = form.querySelector('.delete-btn');
      if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.backgroundColor = '#f44336';
        deleteBtn.style.color = 'white';
        deleteBtn.style.marginRight = 'auto';
        form.querySelector('.form-actions').prepend(deleteBtn);
        
        deleteBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this event?')) {
            this.deleteEvent(event.id);
            modal.style.display = 'none';
          }
        });
      }
      deleteBtn.style.display = 'block';
    } else {
      // Creating new event
      modalTitle.textContent = 'Add New Event';
      form.dataset.eventId = '';
      
      // Hide delete button for new events
      const deleteBtn = form.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
    }
    
    modal.style.display = 'block';
  }

  // Save event from form data
  async saveEvent() {
    const form = this.container.querySelector('#event-form');
    const eventId = form.dataset.eventId ? parseInt(form.dataset.eventId) : null;
    
    const title = form.querySelector('#event-title').value;
    const type = form.querySelector('#event-type').value;
    const start = new Date(form.querySelector('#event-start').value);
    const end = new Date(form.querySelector('#event-end').value);
    const client = form.querySelector('#event-client').value;
    const notes = form.querySelector('#event-notes').value;
    const reminder = parseInt(form.querySelector('#event-reminder').value);
    
    if (start >= end) {
      alert('End time must be after start time');
      return;
    }
    
    let eventData = {
      title,
      type,
      start,
      end,
      client,
      notes,
      reminder
    };
    
    if (eventId) {
      // Update existing event
      eventData.id = eventId;
      const eventIndex = this.events.findIndex(evt => evt.id === eventId);
      
      if (eventIndex === -1) return;
      
      this.events[eventIndex] = {
        ...this.events[eventIndex],
        ...eventData
      };
      
      this.showNotification('Event updated', `"${title}" has been updated`);
      
      // Update in Supabase if enabled
      if (this.options.supabaseEnabled && this.supabaseClient) {
        try {
          const { error } = await this.supabaseClient
            .from(this.options.supabaseTable)
            .update({
              title,
              type,
              start: start.toISOString(),
              end: end.toISOString(),
              client,
              notes,
              reminder
            })
            .eq('id', eventId);
            
          if (error) throw error;
        } catch (error) {
          console.error('Failed to update event in Supabase:', error);
        }
      }
    } else {
      // Create new event
      const newId = this.events.length > 0 
        ? Math.max(...this.events.map(evt => evt.id)) + 1 
        : 1;
      
      eventData.id = newId;
      this.events.push(eventData);
      
      this.showNotification('Event created', `"${title}" has been added to your calendar`);
      
      // Insert into Supabase if enabled
      if (this.options.supabaseEnabled && this.supabaseClient) {
        try {
          const { error } = await this.supabaseClient
            .from(this.options.supabaseTable)
            .insert({
              id: newId,
              title,
              type,
              start: start.toISOString(),
              end: end.toISOString(),
              client,
              notes,
              reminder
            });
            
          if (error) throw error;
        } catch (error) {
          console.error('Failed to insert event to Supabase:', error);
        }
      }
    }
    
    // Close modal and refresh calendar
    this.container.querySelector('.event-modal').style.display = 'none';
    this.renderCalendar();
    
    // Set reminder if needed
    if (reminder > 0) {
      this.setEventReminder(eventId || this.events[this.events.length - 1].id);
    }
    
    // Save events to localStorage for persistence
    this.saveEventsToStorage();
  }

  // Delete an event
  async deleteEvent(eventId) {
    const eventIndex = this.events.findIndex(evt => evt.id === eventId);
    if (eventIndex === -1) return;
    
    const eventTitle = this.events[eventIndex].title;
    
    // Remove from local array
    this.events.splice(eventIndex, 1);
    
    // Delete from Supabase if enabled
    if (this.options.supabaseEnabled && this.supabaseClient) {
      try {
        const { error } = await this.supabaseClient
          .from(this.options.supabaseTable)
          .delete()
          .eq('id', eventId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete event from Supabase:', error);
      }
    }
    
    // Refresh calendar
    this.renderCalendar();
    this.showNotification('Event deleted', `"${eventTitle}" has been removed from your calendar`);
    
    // Save updated events to localStorage
    this.saveEventsToStorage();
  }

  // Save events to localStorage
  saveEventsToStorage() {
    try {
      localStorage.setItem('veritasCalendarEvents', JSON.stringify(this.events));
    } catch (e) {
      console.error('Failed to save events to localStorage:', e);
    }
  }

  // Format date for datetime-local input
  formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Update event dates (for drag and drop)
  updateEventDates(eventId, newStart, newEnd) {
    const eventIndex = this.events.findIndex(evt => evt.id === eventId);
    if (eventIndex === -1) return;
    
    this.events[eventIndex].start = newStart;
    this.events[eventIndex].end = newEnd;
    
    this.renderCalendar();
    this.showNotification('Event moved', `"${this.events[eventIndex].title}" has been rescheduled`);
    
    // Update reminder if set
    if (this.events[eventIndex].reminder > 0) {
      this.setEventReminder(eventId);
    }
    
    // Save events to localStorage
    this.saveEventsToStorage();
  }

  // Set a reminder for an event
  setEventReminder(eventId) {
    const event = this.events.find(evt => evt.id === eventId);
    if (!event || !event.reminder) return;
    
    const reminderTime = new Date(event.start);
    reminderTime.setMinutes(reminderTime.getMinutes() - event.reminder);
    
    // Clear any existing reminder
    if (event.reminderId) {
      clearTimeout(event.reminderId);
    }
    
    const now = new Date();
    if (reminderTime > now) {
      const timeUntilReminder = reminderTime - now;
      
      event.reminderId = setTimeout(() => {
        this.showNotification(
          'Upcoming Event', 
          `"${event.title}" starts in ${event.reminder} minute${event.reminder !== 1 ? 's' : ''}`,
          true
        );
      }, timeUntilReminder);
    }
  }

  // Show a notification
  showNotification(title, message, isAlert = false) {
    const container = this.container.querySelector('.notification-container');
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;
    
    container.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    }, 5000);
    
    // Also show browser notification if requested
    if (isAlert && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    }
  }
}